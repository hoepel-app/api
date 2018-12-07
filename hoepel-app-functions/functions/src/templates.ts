import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import * as JSZip from 'jszip';
import * as Docxtemplater from 'docxtemplater';
import {tmpdir} from 'os';
import {join} from 'path';
import {writeFile as fsWriteFile, unlinkSync} from 'fs';
import {promisify} from 'util';

const writeFile = promisify(fsWriteFile);

const bucket = 'hoepel-app-templates';

const db = admin.firestore();
const storage = admin.storage().bucket(bucket);


export const templateTest = functions
  .region('europe-west1')
  .https.onCall(async (data: { tenant: string, templateFileName: string }, context) => {
    const uid = context.auth.uid;
    const createdBy = context.auth.token.name || context.auth.token.email || null;

    const permissionsDoc = await db.collection('users').doc(uid).collection('tenants').doc(data.tenant).get();

    if (!permissionsDoc.exists || !permissionsDoc.data().permissions.includes('template:read')) {
      return {status: 'error', error: 'No permissions for tenant ' + data.tenant};
    }

    const templateFile = storage.file(data.tenant + '/' + data.templateFileName);
    const templateExists = await templateFile.exists();

    if (!templateExists || !templateExists[0]) {
      return {status: 'error', error: 'Template does not exist: ' + data.templateFileName};
    }

    const template = (await templateFile.download())[0];

    const zip = new JSZip(template);
    const doc = new Docxtemplater();
    doc.loadZip(zip);

    //set the templateVariables
    // TODO check template type?
    doc.setData({
      kind_naam: 'Voornaam Achternaam',
      kind_adres: 'Voorbeeld adres',
      kind_telefoon: 'Voorbeeld telefoon kind',
      kind_geboortedatum: 'Voorbeeld geboortedatum',

      organisator_naam: 'Naam organisator komt hier',
      organisator_adres: 'Adres organisator komt hier',
      organisator_email: 'Email organisator komt hier',
      organisator_telefoon: 'Telefoon organisator komt hier',
      organisator_verantwoordelijke: 'Verantwoordelijke organisator komt hier',

      jaar: 'Jaar komt hier',
      concrete_data: 'Concrete data komen hier',
      aantal_dagen: 'Aantal dagen komt hier',
      prijs_per_dag: 'Prijs per dag komt hier',
      totale_prijs: 'Totale prijs komt hier',
    });

    try {
      // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
      doc.render()
    } catch (error) {
      const err = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        properties: error.properties,
      }
      console.error(JSON.stringify({error: err}));
      // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
      throw error;
    }

    const buf: Buffer = doc.getZip().generate({type: 'nodebuffer'});

    const fileName = Math.random().toString(36).substring(2);

    // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
    const path = join(tmpdir(), fileName);
    await writeFile(path, buf);

    await storage.upload(path, {
      destination: 'test-template/' + fileName,
      metadata: {
        contentDisposition: `inline; filename="voorbeeld template.docx"`,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        metadata: {
          tenant: data.tenant,
          created: new Date().getTime().toString(),
          createdBy,
        },
      }
    });

    unlinkSync(path);

    return { path: 'test-template/' + fileName };
  });

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
