import * as admin from 'firebase-admin';
import { ContactPerson, IContactPerson } from '@hoepel.app/types';
import dropTenant from '../util/drop-tenant';

export class ContactPersonService {
  constructor(
    private db: admin.firestore.Firestore,
  ) {}

  async get(tenant: string, id: string): Promise<ContactPerson | null> {
    const icontactPerson = (await this.db.collection('contact-people').doc(id).get()).data() as (IContactPerson & { tenant: string }) | undefined;

    if (!icontactPerson) {
      return null;
    }

    if (icontactPerson.tenant !== tenant) {
      throw new Error(`Requested contact person ${id} for tenant ${tenant}, but tenant did not match (actual tenant: ${icontactPerson.tenant})`);
    }

    return new ContactPerson(dropTenant(icontactPerson));
  }
}
