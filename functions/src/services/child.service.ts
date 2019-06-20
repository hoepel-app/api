import * as admin from 'firebase-admin';
import { Child, childMapper, IChild, store, TenantIndexedCrudService } from '@hoepel.app/types';
import { FirebaseTenantIndexedWithIdCrudService } from './crud.service';

export type IChildService = TenantIndexedCrudService<Child>;

export const createChildService = (db: admin.firestore.Firestore) => new FirebaseTenantIndexedWithIdCrudService<IChild, Child>(
  db,
  store.children,
  childMapper,
);
