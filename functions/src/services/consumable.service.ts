import * as admin from 'firebase-admin';
import { Consumable, IConsumable, store, TenantIndexedRepository, ConsumableDoc } from '@hoepel.app/types';
import { FirebaseRepository, FirebaseTenantIndexedRepository } from './repository';

export type IConsumableRepository = TenantIndexedRepository<{ readonly consumables: readonly Consumable[] }>;

export const createConsumableRepository = (db: admin.firestore.Firestore) => new FirebaseRepository<
  ConsumableDoc, readonly Consumable[]>(
  db,
  store.consumables,
);
