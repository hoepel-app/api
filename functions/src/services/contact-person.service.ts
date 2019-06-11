import * as admin from 'firebase-admin';
import { ContactPerson, IContactPerson } from '@hoepel.app/types';
import { CrudService } from './crud.service';

export class ContactPersonService extends CrudService<ContactPerson, IContactPerson> {
  collectionName = 'contact-people';

  constructor(
    db: admin.firestore.Firestore,
  ) {
    super(db);
  }

  lift(obj: IContactPerson): ContactPerson {
    return new ContactPerson(obj);
  }
}
