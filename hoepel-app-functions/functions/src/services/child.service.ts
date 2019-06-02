import * as admin from 'firebase-admin';
import { Child, IChild } from '@hoepel.app/types';
import dropTenant from '../util/drop-tenant';

export class ChildService {
  constructor(
    private db: admin.firestore.Firestore,
  ) {}

  async get(tenant: string, id: string): Promise<Child | null> {
    const ichild = (await this.db.collection('children').doc(id).get()).data() as (IChild & { tenant: string }) | undefined;

    if (!ichild) {
      return null;
    }

    if (ichild.tenant !== tenant) {
      throw new Error(`Requested child ${id} for tenant ${tenant}, but tenant did not match (actual tenant: ${ichild.tenant})`);
    }

    return new Child(dropTenant(ichild));
  }
}
