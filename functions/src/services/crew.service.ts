import * as admin from 'firebase-admin';
import { FirebaseTenantIndexedRepository } from './repository';
import { Crew, crewMapper, ICrew, store, TenantIndexedRepository } from '@hoepel.app/types';

export type ICrewRepository = TenantIndexedRepository<Crew>;

export const createCrewRepository = (db: admin.firestore.Firestore) => new FirebaseTenantIndexedRepository<ICrew, Crew>(
  db,
  store.crewMembers,
);
