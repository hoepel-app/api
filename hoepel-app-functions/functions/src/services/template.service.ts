import * as admin from 'firebase-admin';
import * as JSZip from 'jszip';
import * as Docxtemplater from 'docxtemplater';
import { join } from "path";
import { tmpdir } from "os";
import {writeFile as fsWriteFile, unlink as fsUnlink} from 'fs';
import {promisify} from 'util';

const writeFile = promisify(fsWriteFile);
const unlink = promisify(fsUnlink);

// declare class Docxtemplater {
//   constructor();
//
//   loadZip(zip: JSZip): void;
//   setData(tags: { [key: string]: string }): void;
//   render(): void;
//   getZip(): JSZip;
//   attachModule(module: any);
//   setOptions(options: {
//     nullGetter?: (part) => string
//     xmlFileNames?: ReadonlyArray<string>,
//     parser?: (tag: string) => string,
//     linebreaks: boolean,
//     delimiters?: { start: string, end: string },
//   }): void;
// }

interface CertificateTemplateFillInData {
  kind_naam: string,
  kind_adres: string,
  kind_telefoon: string,
  kind_geboortedatum: string,

  organisator_naam: string,
  organisator_adres: string,
  organisator_email: string,
  organisator_telefoon: string,
  organisator_verantwoordelijke: string,

  jaar: string,
  concrete_data: string,
  aantal_dagen: string,
  prijs_per_dag: string,
  totale_prijs: string,
}

const exampleData: CertificateTemplateFillInData = {
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
};

export class TemplateService {
  constructor(
    private db: admin.firestore.Firestore,
    private storage: any, // Bucket
  ) {
  }

  /**
   * @param tenant Name of the tenant
   * @param templateFileName The file name of the template to test
   * @param createdBy Name or email address of the person who requested to test this template
   * @param createdByUid User id of the person who requested to test this template
   */
  async testTemplate(tenant: string, templateFileName: string, createdBy: string, createdByUid: string) {
    const filledIn = await this.getAndFillTemplate(tenant, templateFileName, exampleData);

    const fileName = Math.random().toString(36).substring(2);

    // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
    const path = join(tmpdir(), fileName);
    await writeFile(path, filledIn);

    await this.storage.upload(path, {
      destination: 'test-template/' + fileName,
      metadata: {
        contentDisposition: `inline; filename="voorbeeld template.docx"`,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        metadata: {
          tenant: tenant,
          created: new Date().getTime().toString(),
          createdBy,
          createdByUid,
        },
      }
    });

    await unlink(path);

    return { path: 'test-template/' + fileName };
  }

  /**
   * Get a file from remote storage, load it, and fill in with the given data
   */
  private async getAndFillTemplate(tenant: string, templateFileName: string, data: CertificateTemplateFillInData): Promise<Buffer> {
    const template = this.loadDocument(await this.getTemplate(tenant, templateFileName));
    return this.fillIn(template, data);
  }

  /**
   * Get a template by name from storage
   */
  private async getTemplate(tenant: string, templateFileName): Promise<Buffer> {
    const templateFile = this.storage.file(tenant + '/' + templateFileName);
    const templateExists = await templateFile.exists();

    if (!templateExists || !templateExists[0]) {
      throw new Error(`Template does not exist: ${templateFileName}`);
    }

    return (await templateFile.download())[0];
  }

  /**
   * Load a .docx file (provided as a buffer) and turn it into a Docxtemplater object
   */
  private loadDocument(template: Buffer): Docxtemplater {
    const zip = new JSZip(template); // DocxTemplater only supports loading zips from JSZip, create zipped template
    const doc = new Docxtemplater();
    doc.loadZip(zip);
    doc.setOptions({linebreaks: true});

    return doc;
  }

  /**
   * Fill in a document and return it as a buffer
   */
  private fillIn(doc: Docxtemplater, data: any): Buffer {
    try {
      doc.setData(data);
      doc.render();
      return doc.getZip().generate({type: 'nodebuffer'});
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
  }
}
