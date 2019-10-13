import * as admin from 'firebase-admin';
import { AgeGroup, IAgeGroup, store, TenantIndexedRepository } from '@hoepel.app/types';
import { FirebaseRepository, FirebaseTenantIndexedRepository } from './repository';

export type IAgeGroupRepository = TenantIndexedRepository<{ readonly groups: readonly AgeGroup[] }>;

export const createAgeGroupRepository = (db: admin.firestore.Firestore) => new FirebaseRepository<
  { readonly groups: readonly IAgeGroup[] }, { readonly groups: readonly AgeGroup[] }>(
  db,
  store.ageGroups,
);
