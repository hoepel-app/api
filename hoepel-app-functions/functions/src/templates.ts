import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import {writeFile as fsWriteFile} from 'fs';
import {promisify} from 'util';

const writeFile = promisify(fsWriteFile);

const bucket = 'hoepel-app-templates';

const db = admin.firestore();
const storage = admin.storage().bucket(bucket);

// DELETE /:tenant/templates/:templateId
export const templateDeletionRequest = functions
  .region('europe-west1')
  .https.onCall(async (data: { tenant: string, templateFileName: string }, context) => {
    const uid = context.auth.uid;

    const permissionsDoc = await db.collection('users').doc(uid).collection('tenants').doc(data.tenant).get();

    if (!permissionsDoc.exists || !permissionsDoc.data().permissions.includes('template:write')) {
      return { status: 'error', error: 'No permissions for tenant ' + data.tenant  };
    }

    const docs = await db.collection('templates').where('fileName', '==', data.templateFileName).where('tenant', '==', data.tenant).get();

    if (docs.empty) {
      console.warn(`Could not find document for tenant ${data.tenant} with fileName ${data.templateFileName}`);
      return { status: 'error', error: `Could not find document for tenant ${data.tenant} with fileName ${data.templateFileName}` };
    }

    if (docs.docs[0].data().tenant !== data.tenant) {
      console.warn(`Tried to delete ${data.templateFileName} but it does not belong to tenant ${data.tenant}`);
      return { status: 'error', error: `Tried to delete ${data.templateFileName} but it does not belong to tenant ${data.tenant}` };
    }

    await db.collection('templates').doc(docs.docs[0].id).delete();
    await storage.file(data.tenant + '/' + data.templateFileName).delete();

    return { status: 'ok', deletedId: data.templateFileName };
  });
