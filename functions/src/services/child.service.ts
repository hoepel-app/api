import * as admin from 'firebase-admin';
import { Child, childMapper, IChild, store, TenantIndexedRepository } from '@hoepel.app/types';
import { FirebaseTenantIndexedRepository } from './repository';

export type IChildRepository = TenantIndexedRepository<Child>;

export const createChildRepository = (db: admin.firestore.Firestore) => new FirebaseTenantIndexedRepository<IChild, Child>(
  db,
  store.children,
);
