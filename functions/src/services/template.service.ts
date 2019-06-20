import * as admin from 'firebase-admin';
import * as JSZip from 'jszip';
import * as Docxtemplater from 'docxtemplater';
import { IChildRepository } from './child.service';
import { AddressService } from './address.service';
import { OrganisationService } from './organisation.service';
import { ChildAttendanceService } from './child-attendance.service';
import { IShiftRepository, ShiftService } from './shift.service';
import { DayDate, FileType, Price, Shift } from '@hoepel.app/types';
import * as _ from 'lodash';
import dropTenant from '../util/drop-tenant';

interface CertificateTemplateFillInData {
  readonly kind_naam: string,
  readonly kind_adres: string,
  readonly kind_telefoon: string,
  readonly kind_geboortedatum: string,

  readonly organisator_naam: string,
  readonly organisator_adres: string,
  readonly organisator_email: string,
  readonly organisator_telefoon: string,
  readonly organisator_verantwoordelijke: string,

  readonly jaar: string,
  readonly concrete_data: string,
  readonly aantal_dagen: string,
  readonly prijs_per_dag: string,
  readonly totale_prijs: string,
}

interface CertificateTemplateFillInOptions {
  /**
   * Name of the template to use. This is the file name of the template in the templates bucket
   */
  readonly templateFileName: string;

  readonly childId: string;

  /**
   * Only get data for this year
   */
  readonly year: number;

  /**
   * Name or email address of the requesting user
   */
  readonly createdBy: string;

  /**
   * Id of the requesting user
   */
  readonly createdByUid: string;
}

/**
 * Metadata for templates stored in Firestore
 */
interface TemplateMetadata {
  created: Date;
  createdBy: string;
  displayName: string;
  fileName: string;
  type: FileType;
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
    private templatesStorage: any, // Bucket
    private reportsStorage: any, // Bucket
    private childRepository: IChildRepository,
    private addressService: AddressService,
    private organisationService: OrganisationService,
    private childAttendanceService: ChildAttendanceService,
    private shiftRepository: IShiftRepository,
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

    await this.templatesStorage.file('test-template/' + fileName).save(filledIn, {
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

    return { path: 'test-template/' + fileName };
  }

  async fillInChildTemplate(tenant: string, options: CertificateTemplateFillInOptions) {
    const data = await this.getChildData(tenant, options.childId, options.year);
    const childName = data.kind_naam;
    const filledIn = await this.getAndFillTemplate(tenant, options.templateFileName, data);
    const expires = this.getExpirationDate(new Date());

    const fileMetadata = await this.getFileMetadata(tenant, options.templateFileName);
    const reportType = fileMetadata.type;
    const fileNamePrefix = this.getFileNamePrefix(reportType);

    const fileName = `${new Date().getTime().toString()} ${tenant} ${fileNamePrefix} ${childName} ${options.year}.docx`;

    // Upload file to storage
    await this.reportsStorage.file(fileName).save(filledIn, {
      metadata: {
        contentDisposition: `inline; filename="${fileNamePrefix} ${childName} ${options.year}.docx"`,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        metadata: {
          tenant,
          expires: expires.getTime().toString(),
        },
      }
    });

    // Save to Firestore
    const docToSave = {
      expires,
      created: new Date(),
      createdBy: options.createdBy,
      createdByUid: options.createdByUid,
      description: `${fileNamePrefix} ${childName} (${options.year})`,
      format: 'DOCX',
      refPath: fileName,
      tenant,
      type: reportType,
      childId: options.childId,
      year: options.year,
      fillInParameters: data,
    };

    await this.db.collection('reports').add(docToSave);

    return docToSave;
  }

  async deleteTemplate(tenant: string, templateFileName: string) {
    const docs = await this.db.collection('templates').where('fileName', '==', templateFileName).where('tenant', '==', tenant).get();

    if (docs.empty) {
      throw new Error(`Could not find template to delete for tenant ${tenant} with fileName ${templateFileName}`);
    }

    if (docs.docs[0].data().tenant !== tenant) {
      throw new Error(`Tried to delete ${templateFileName} but it does not belong to tenant ${tenant}`);
    }

    await this.db.collection('templates').doc(docs.docs[0].id).delete();
    await this.templatesStorage.file(tenant + '/' + templateFileName).delete();

    return { deletedId: templateFileName };
  }

  private async getFileMetadata(tenant: string, templateFileName: string): Promise<TemplateMetadata & { id: string } | null> {
    const snapshot = await this.db.collection('templates')
      .where('fileName', '==', templateFileName)
      .where('tenant', '==', tenant)
      .get();

    if (snapshot.empty) {
      throw new Error(`Metadata in Firestore not found for ${templateFileName} for tenant ${tenant}`);
    }

    const doc = snapshot.docs[0];
    return dropTenant({ id: doc.id, ...(doc.data() as TemplateMetadata & { tenant: string }) });
  }

  /**
   * Create a file name prefix depending of the report type. This prefix will be joined with child's name
   */
  private getFileNamePrefix(reportType: FileType) {
    switch (reportType) {
      case 'child-fiscal-certificate':
        return 'Fiscaal attest voor ';
      case 'child-health-insurance-certificate':
        return 'Attest mutualiteit voor ';
      default:
        return 'Attest voor ';
    }
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
    const templateFile = this.templatesStorage.file(tenant + '/' + templateFileName);
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

      console.error('Could not fill in DOCX template');
      console.error(JSON.stringify({error: err}));
      // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
      throw error;
    }
  }

  private getExpirationDate(creationDate: Date): Date {
    const expires = new Date(creationDate);
    expires.setFullYear(expires.getFullYear() + 1); // Document expires in a year from now
    return expires;
  }

  private async getChildData(tenant: string, childId: string, year: number): Promise<CertificateTemplateFillInData> {
    const child = await this.childRepository.get(tenant, childId);
    const address = await this.addressService.getAddressForChild(tenant, child);
    const organisation = await this.organisationService.getDetails(tenant);

    const attendances = await this.childAttendanceService.getAttendancesForChild(tenant, childId);
    const shiftIds = Object.keys(attendances);
    const shifts = Shift.sort((await this.shiftRepository.getMany(tenant, shiftIds)))
      .filter(shift => shift && DayDate.fromDayId(shift.dayId).year === year); // Only keep shifts in this year
    const numberOfUniqueDays = ShiftService.numberOfUniqueDays(shifts);

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

    const specificDates = shifts.map(shift => DayDate.fromDayId(shift.dayId).toString() + ' (' + shift.kind + ')').join(', ');

    const organisationAddress = (organisation.address.streetAndNumber || '') +
      (organisation.address.zipCode || '') +
      (organisation.address.city || '');

    return {
      kind_naam: child.fullName,
      kind_adres: AddressService.formatAddress(address),
      kind_telefoon: child.phone[0] ? (child.phone[0].phoneNumber || '') : '',
      kind_geboortedatum: child.birthDate.toDDMMYYYY('/'),

      organisator_naam: organisation.name,
      organisator_adres: organisationAddress,
      organisator_email: organisation.email,
      organisator_telefoon: organisation.contactPerson ? organisation.contactPerson.phone || '' : '',
      organisator_verantwoordelijke: organisation.contactPerson ? organisation.contactPerson.name || '' : '',

      jaar: year.toString(),
      concrete_data: specificDates,
      aantal_dagen: `${numberOfUniqueDays} (${shifts.length} dagdelen/activiteiten)`,
      prijs_per_dag: pricePerShift,
      totale_prijs: totalPricePaid.toString(),
    };
  }
}
