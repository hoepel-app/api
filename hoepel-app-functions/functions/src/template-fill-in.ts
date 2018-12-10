import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import * as JSZip from 'jszip';
import * as Docxtemplater from 'docxtemplater';
import * as _ from 'lodash';
import {tmpdir} from 'os';
import {join} from 'path';
import {writeFile as fsWriteFile, unlinkSync} from 'fs';
import {promisify} from 'util';
import {Child, DayDate, IChild, IDetailedChildAttendance, IShift, Price, Shift} from "@hoepel.app/types";

const writeFile = promisify(fsWriteFile);

const templatesBucket = 'hoepel-app-templates';
const filesBucket = 'hoepel-app-reports';

const db = admin.firestore();
const filesStorage = admin.storage().bucket(filesBucket);
const templatesStorage = admin.storage().bucket(templatesBucket);


export const fillInHealthInsuranceCertificate = functions
  .region('europe-west1')
  .https.onCall(async (data: { tenant: string, templateFileName: string, childId: string, year: number }, context) => {

    const uid = context.auth.uid;
    const createdBy = context.auth.token.name || context.auth.token.email || null;

    // Check if user has required permissions
    const permissionsDoc = await db.collection('users').doc(uid).collection('tenants').doc(data.tenant).get();

    if (!permissionsDoc.exists
      || !permissionsDoc.data().permissions.includes('template:read')
      || !permissionsDoc.data().permissions.includes('template:fill-in')
      || !permissionsDoc.data().permissions.includes('child:read')
    ) {
      throw new Error(`User does not have the required permissions to generate a template. Tenant ${data.tenant}, uid: ${uid}, childId: ${data.childId}`);
    }

    // Get child
    const ichild = (await db.collection('children').doc(data.childId).get()).data() as (IChild & { tenant: string }) | undefined;

    if (!ichild || ichild.tenant !== data.tenant) {
      throw new Error(`Child did not exist or tenant did not match. Tenant ${data.tenant}, uid: ${uid}, childId: ${data.childId}`);
    }

    const child = new Child(Object.assign(ichild, { id: data.childId }));

    console.log(child);

    // Get attendances for child
    const attendancesDoc: { attendances: { [key: string]: IDetailedChildAttendance }  } | undefined = (await db.collection('child-attendances-by-child').doc(data.childId).get()).data() as any;
    const attendances = (attendancesDoc && attendancesDoc.attendances) ? attendancesDoc.attendances : {};

    // Get shifts
    const shiftIds = Object.keys(attendances);
    const shifts = Shift.sort((await db.getAll(...shiftIds.map(id => db.collection('shifts').doc(id))))
      .map(snapshot => new Shift(Object.assign(snapshot.data(), {id: snapshot.id}) as IShift))
      .filter(shift => shift && DayDate.fromDayId(shift.dayId).year === data.year) // Only keep shifts in this year
    );

    const numberOfUniqueDays = new Set(shifts.map(shift => shift.dayId)).size;

    const totalPricePaid = _.toPairs(attendances)
      .map(att => att[1].amountPaid)
      .map(iprice => new Price(iprice))
      .reduce((x, y) => x.add(y), new Price({ cents: 0, euro: 0 }));

    const pricePerShift = shifts
      .map(shift => {
        const day = DayDate.fromDayId(shift.dayId).toString();
        const price = new Price(_.toPairs(attendances).find(att => att[0] === shift.id)[1].amountPaid);

        return `${day.toString()} (${shift.kind}): ${price.toString()}`;
      })
      .join(', ');

    // Get template
    const templateFile = templatesStorage.file(data.tenant + '/' + data.templateFileName);
    const templateExists = await templateFile.exists();

    if (!templateExists || !templateExists[0]) {
      return {status: 'error', error: 'Template does not exist: ' + data.templateFileName};
    }

    const template = (await templateFile.download())[0];

    // Load template into templater
    const zip = new JSZip(template);
    const doc = new Docxtemplater();
    doc.loadZip(zip);

    // Set placeholder data
    doc.setData({
      kind_naam: child.fullName,
      kind_adres: 'Voorbeeld adres', // TODO
      kind_telefoon: 'Voorbeeld telefoon kind', // TODO
      kind_geboortedatum: (child.birthDate ? child.birthDate.toString() : ''),

      jaar: data.year.toString(),
      concrete_data: shifts.map(shift => DayDate.fromDayId(shift.dayId).toString() + ' (' + shift.kind + ')').join(', '),
      aantal_dagen: `${numberOfUniqueDays} (${shifts.length} dagdelen/activiteiten)`,
      prijs_per_dag: pricePerShift,
      totale_prijs: totalPricePaid.toString(),
      gemaakt_op: '', // TODO
    });

    try {
      // replace placeholders by values
      doc.render()
    } catch (error) {
      const err = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        properties: error.properties,
      };
      console.error(JSON.stringify({error: err}));
      // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
      throw error;
    }

    const buf: Buffer = doc.getZip().generate({type: 'nodebuffer'});

    const fileName = `${new Date().getTime().toString()} ${data.tenant} Attest mutualiteit voor ${child.fullName} ${data.year}`;

    // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
    const path = join(tmpdir(), fileName);
    await writeFile(path, buf);


    // Document expires in a year from now
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);

    await filesStorage.upload(path, {
      destination: fileName,
      metadata: {
        contentDisposition: `inline; filename="Attest mutualiteit ${child.fullName} voor ${data.year}.docx"`,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        metadata: {
          tenant: data.tenant,
          expires: expires.getTime().toString(),
        },
      }
    });

    // Delete file on local disk (limited in-memory file system)
    unlinkSync(path);

    // save document to firestore
    const docToSave = {
      expires,
      created: new Date(),
      createdBy,
      description: `Bewijsje voor mutualiteit voor ${child.fullName} (${data.year})`,
      format: 'DOCX',
      refPath: fileName,
      tenant: data.tenant,
      type: 'child-health-insurance-certificate',
    };

    await db.collection('reports').add(docToSave);

    return docToSave;
  });
