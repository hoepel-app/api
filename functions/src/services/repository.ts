import * as admin from 'firebase-admin';
import {
  DocumentNotFoundError,
  IncorrectTenantError,
  Mapper,
  TenantIndexedMappingCollection,
  TenantIndexedRepository,
} from '@hoepel.app/types';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';

// TODO IT may not contain a 'tenant' property but can't express this with Omit<{ [field: string]: any; }, 'tenant'> ATM - does nothing
export class FirebaseTenantIndexedRepository<IT, T> implements TenantIndexedRepository<T> {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private collection: TenantIndexedMappingCollection<IT, T>,
    private mapper: Mapper<Pick<IT & { tenant: string }, Exclude<keyof IT, 'tenant'>>, T>,
  ) {
  }

  async get(tenant: string, id: string): Promise<T> {
    const snapshot: DocumentSnapshot = await this.db.collection(this.collection.collectionName).doc(id).get();
    const test = snapshot.data() as IT & { tenant: string };
    const {tenant: actualTenant, ...data} = test;

    if (!snapshot.exists) {
      throw new DocumentNotFoundError(id, this.collection.collectionName);
    } else if (actualTenant !== tenant) {
      throw new IncorrectTenantError(tenant, actualTenant, this.collection.collectionName, id);
    } else {
      return this.mapper.lift(id, data);
    }
  }

  async getAll(tenant: string): Promise<ReadonlyArray<T>> {
    const snapshot = await this.db
      .collection(this.collection.collectionName)
      .where('tenant', '==', tenant)
      .get();

    return snapshot.docs
      .filter(docSnapshot => docSnapshot.data().tenant === tenant)
      .map(docSnapshot => {
        const {tenant: actualTenant, ...obj} = docSnapshot.data();
        return this.mapper.lift(docSnapshot.id, obj as Pick<IT & { tenant: string }, Exclude<keyof IT, 'tenant'>>);
      });
  }

  async getMany(tenant: string, ids: ReadonlyArray<string>): Promise<ReadonlyArray<T>> {
    if (ids.length > 0) {
      const docReferences = ids.map((id: string) => this.db.collection(this.collection.collectionName).doc(id));
      const snapshots = await this.db.getAll(...docReferences);

      return snapshots.map(snapshot => {
        const {tenant: actualTenant, ...obj} = snapshot.data();
        return this.mapper.lift(snapshot.id, obj as Pick<IT & { tenant: string }, Exclude<keyof IT, 'tenant'>>);
      })
    } else {
      return Promise.resolve([]);
    }
  }

  async delete(tenant: string, id: string): Promise<void> {
    await this.get(tenant, id); // will throw if incorrect tenant
    await this.db.collection(this.collection.collectionName).doc(id).delete();
  }
}
