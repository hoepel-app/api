import * as admin from 'firebase-admin';
import { ContactPerson, contactPersonMapper, IContactPerson, store, TenantIndexedRepository } from '@hoepel.app/types';
import { FirebaseTenantIndexedRepository } from './repository';

export type IContactPersonRepository = TenantIndexedRepository<ContactPerson>;

export const createContactPersonRepository = (db: admin.firestore.Firestore) => new FirebaseTenantIndexedRepository<IContactPerson, ContactPerson>(
  db,
  store.contactPeople,
  contactPersonMapper,
);
