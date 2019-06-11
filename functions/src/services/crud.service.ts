import * as admin from 'firebase-admin';
import dropTenant from '../util/drop-tenant';


/**
 * Abstract class that can be used to create a service for a Firestore collection
 *
 * The objects in the collection are assumed to have a 'tenant' field, which is not returned.
 *
 * @param T The class, e.g. 'Child'
 * @param IT The interface that represents the plain data return from Firestore, e.g. 'IChild'
 */
export abstract class CrudService<T extends { id?: string }, IT extends { id?: string }> {
  /**
   * Name of the collection in Firestore
   */
  abstract readonly collectionName: string;

  constructor(
    protected readonly db: admin.firestore.Firestore,
  ) {}


  /**
   * Lift the interface to the class, usually as simple as (obj: IChild): Child => new Child(obj)
   */
  abstract lift(obj: Omit<IT, 'tenant'>): Omit<T, 'tenant'>;


  async get(tenant: string, id: string): Promise<Omit<T, 'tenant'> | null> {
    const iobj = (await this.db.collection(this.collectionName).doc(id).get()).data() as (IT & { tenant: string }) | undefined;

    if (!iobj) {
      return null;
    }

    if (iobj.tenant !== tenant) {
      throw new Error(
        `Requested entity ${id} from collection ${this.collectionName} for tenant ${tenant},` +
        ` but tenant did not match (actual tenant: ${iobj.tenant})`
      );
    }

    return this.plainToObject(iobj, id);
  }

  async getAll(tenant: string): Promise<ReadonlyArray<Omit<T, 'tenant'>>> {
    const all = await this.db.collection(this.collectionName).where('tenant', '==', tenant).get();

    return all.docs.map(doc => this.plainToObject(doc.data() as any, doc.id));
  }

  async getMany(tenant: string, ids: ReadonlyArray<string>): Promise<ReadonlyArray<Omit<T, 'tenant'>>> {
    // tslint:disable:no-unnecessary-type-assertion

    if (ids.length > 0) {
      const id2doc = (id: string) => this.db.collection(this.collectionName).doc(id);

      const all = (await this.db.getAll(id2doc(ids[0]), ...ids.slice(1).map(id2doc))) // can't do ...ids.map(id2doc) due to some TS error
        .filter(snapshot => snapshot.data().tenant === tenant)
        .map(snapshot => this.plainToObject(snapshot.data() as any, snapshot.id));

      return all;
    } else {
      return Promise.resolve([]);
    }
  }

  private plainToObject(iobj: IT & { tenant: string }, id: string): Omit<T, 'tenant'> {
    return this.lift({
      ...dropTenant(iobj),
      id,
    });
  }
}
