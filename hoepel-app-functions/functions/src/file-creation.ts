import * as functions from 'firebase-functions';
import {
  childListToXlsx,
  childrenWithCommentsListToXlsx, createAllFiscalCertsXlsx, createChildAttendanceXlsx, createCrewAttendanceXlsx,
  crewListToXlsx,
  LocalFileCreationResult,
} from './services/data-to-xlsx';
import {
  Child,
  Crew,
  DayDate,
  FileRequestMetadata,
  FileType,
  IChild,
  ICrew,
  IDetailedChildAttendance,
  IShift,
  Shift
} from '@hoepel.app/types';
import { unlinkSync } from 'fs';
import * as admin from 'firebase-admin';

const bucket = 'hoepel-app-reports';

const db = admin.firestore();

const storage = admin.storage().bucket(bucket);

export const fileDeletionRequest = functions
  .region('europe-west1')
  .https.onCall(async (data: { tenant: string, fileName: string }, context) => {
    const uid = context.auth.uid;

    const permissionsDoc = await db.collection('users').doc(uid).collection('tenants').doc(data.tenant).get();

    if (!permissionsDoc.exists || !permissionsDoc.data().permissions.includes('reports:request')) {
      return { status: 'error', error: 'No permissions for tenant ' + data.tenant  };
    }

    const docs = await db.collection('reports').where('refPath', '==', data.fileName).where('tenant', '==', data.tenant).get();

    if (docs.empty) {
      console.warn(`Could not find document for tenant ${data.tenant} with fileName ${data.fileName}`);
      return { status: 'error', error: `Could not find document for tenant ${data.tenant} with fileName ${data.fileName}` };
    }

    if (docs.docs[0].data().tenant !== data.tenant) {
      console.warn(`Tried to delete ${data.fileName} but it does not belong to tenant ${data.tenant}`);
      return { status: 'error', error: `Tried to delete ${data.fileName} but it does not belong to tenant ${data.tenant}` };
    }

    await storage.file(data.fileName).delete();
    await db.collection('reports').doc(docs.docs[0].id).delete();

    return { status: 'ok', deletedId: data.fileName };
  });

const getShiftsInYear = async (year: number, tenant): Promise<ReadonlyArray<Shift>> => {
  const qs = await db.collection('shifts')
    .where('tenant', '==', tenant)
    .get();

  return qs.docs
    .map(shift => new Shift({ ...(shift.data() as IShift), id: shift.id }))
    .filter(shift => DayDate.fromDayId(shift.dayId).year === year);
};

const getCrewAttendancesOnShifts = async (shifts: ReadonlyArray<IShift>, tenant: string): Promise<ReadonlyArray<{ shiftId: string, attendances: ReadonlyArray<any> }>> => {
  const all = await Promise.all(
    shifts.map(shift => db.collection('crew-attendances-by-shift').doc(shift.id).get())
  );

  return all.filter(snapshot => snapshot.exists && snapshot.data().attendances && snapshot.data().tenant === tenant).map(snapshot => {
    return {
      shiftId: snapshot.id,
      attendances: snapshot.data().attendances,
    };
  });
};

const getChildAttendancesOnShifts = async (shifts: ReadonlyArray<IShift>, tenant: string): Promise<ReadonlyArray<{ shiftId: string, attendances: ReadonlyArray<IDetailedChildAttendance> }>> => {
  const all = await Promise.all(
    shifts.map(shift => db.collection('child-attendances-by-shift').doc(shift.id).get())
  );

  return all.filter(snapshot => snapshot.exists && snapshot.data().attendances && snapshot.data().tenant === tenant).map(snapshot => {
    return {
      shiftId: snapshot.id,
      attendances: snapshot.data().attendances,
    };
  });
};

export const fileCreationRequest = functions
  .region('europe-west1')
  .https.onCall(async (data: { type: FileType, metadata: FileRequestMetadata }, context) => {
      const uid = context.auth.uid;
      const createdBy = context.auth.token.name || context.auth.token.email || null;

      const permissionsDoc = await db.collection('users').doc(uid).collection('tenants').doc(data.metadata.tenant).get();

      if (!permissionsDoc.exists || !permissionsDoc.data().permissions.includes('reports:request')) {
        return { status: 'error', error: 'No permissions for tenant ' + data.metadata.tenant  };
      }

      let localFile: LocalFileCreationResult;

      switch (data.type) {
        case 'all-children':
          const allChildren = await db.collection('children').where('tenant', '==', data.metadata.tenant).get();
          localFile = childListToXlsx(allChildren.docs.map(x => x.data() as IChild), data.metadata.tenant);
          break;

        case 'all-crew':
          const allCrew = await db.collection('crew-members').where('tenant', '==', data.metadata.tenant).get();
          localFile = crewListToXlsx(allCrew.docs.map(x => x.data() as ICrew), data.metadata.tenant);
          break;

        case 'children-with-comment':
          const childrenWithComment = await db.collection('children').where('tenant', '==', data.metadata.tenant).get();
          const filteredChildren = childrenWithComment.docs.map(x => x.data() as IChild).filter(child => child.remarks);
          localFile = childrenWithCommentsListToXlsx(filteredChildren, data.metadata.tenant);
          break;

        case 'crew-attendances':
          if (!data.metadata.year) {
            console.error('metadata.year is missing for request with type crew-attendances');
            return { 'status': 'error', 'error': 'metadata.year is required for this call' };
          }

          const allCrewForAtt = (await db.collection('crew-members').where('tenant', '==', data.metadata.tenant).get()).docs
            .map(snapshot => new Crew({ ...(snapshot.data() as ICrew), id: snapshot.id }))
            .filter(crew => crew.active);

          const shiftsForCrewAtt = await getShiftsInYear(data.metadata.year, data.metadata.tenant);
          const crewAttendances = await getCrewAttendancesOnShifts(shiftsForCrewAtt, data.metadata.tenant);

          localFile = createCrewAttendanceXlsx(allCrewForAtt, shiftsForCrewAtt, crewAttendances, data.metadata.year, data.metadata.tenant);
          break;

        case 'child-attendances':
          if (!data.metadata.year) {
            console.error('metadata.year is missing for request with type child-attendances');
            return { 'status': 'error', 'error': 'metadata.year is required for this call' };
          }

          const allChildrenForChildAtt = (await db.collection('children').where('tenant', '==', data.metadata.tenant).get()).docs
            .map(snapshot => new Child({ ...(snapshot.data() as IChild), id: snapshot.id }));

          const shiftsForChildAtt = await getShiftsInYear(data.metadata.year, data.metadata.tenant);
          const childAttendancesForChildAtt = await getChildAttendancesOnShifts(shiftsForChildAtt, data.metadata.tenant);

          localFile = createChildAttendanceXlsx(allChildrenForChildAtt, shiftsForChildAtt, childAttendancesForChildAtt, data.metadata.year, data.metadata.tenant);
          break;
        case 'fiscal-certificates-list':
          if (!data.metadata.year) {
            console.error('metadata.year is missing for request with type fiscal-certificates-list');
            return { 'status': 'error', 'error': 'metadata.year is required for this call' };
          }

          const allChildrenForFiscalCerts = (await db.collection('children').where('tenant', '==', data.metadata.tenant).get()).docs
            .map(snapshot => new Child({ ...(snapshot.data() as IChild), id: snapshot.id }));

          const shiftsForFiscalCerts = await getShiftsInYear(data.metadata.year, data.metadata.tenant);
          const childAttendancesForFiscalCerts = await getChildAttendancesOnShifts(shiftsForFiscalCerts, data.metadata.tenant);

          localFile = createAllFiscalCertsXlsx(allChildrenForFiscalCerts, shiftsForFiscalCerts, childAttendancesForFiscalCerts, data.metadata.year, data.metadata.tenant);
          break;

        default:
          console.error('Unknown file request type: ' + data.type);
          return { status: 'error', error: 'Unknown file type: ' + data.type };
      }

      // Document expires in a year from now
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);

      // Upload to storage
      const uploadResult = await storage.upload(localFile.path, {
        metadata: {
          metadata: {
            tenant: data.metadata.tenant,
            expires: expires.getTime().toString(),
          },

          // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
          // https://stackoverflow.com/questions/1741353/how-to-set-response-filename-without-forcing-saveas-dialog
          contentDisposition: `inline; filename="${localFile.downloadFileName}"`,
        },
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // TODO what if PDF?
        destination: localFile.localFileName,
      });

      // Delete file on local disk (limited in-memory file system)
      unlinkSync(localFile.path);

      // save document to firestore
      const docToSave = {
        expires,
        created: new Date(),
        createdBy,
        createdByUid: context.auth.uid,
        description: localFile.description,
        format: localFile.format,
        refPath: uploadResult[0].name,
        tenant: data.metadata.tenant,
        type: data.type,
      };

      await db.collection('reports').add(docToSave);

      return docToSave;
  });
