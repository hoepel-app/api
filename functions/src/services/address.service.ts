import { ContactPersonService } from './contact-person.service';
import { Child, IAddress } from '@hoepel.app/types';

export class AddressService {
  constructor(
    private contactPersonService: ContactPersonService,
  ) {}

  async getAddressForChild(tenant: string, child: Child): Promise<IAddress | null> {
    if (child.address.isValid) {
      return Promise.resolve(child.address);
    } else if(child.primaryContactPerson) {
      const primaryContactPerson = await this.contactPersonService.get(tenant, child.primaryContactPerson.contactPersonId);

      return primaryContactPerson.address.isValid ? primaryContactPerson.address : null;

    } else {
      // No address on child, no primary contact person
      return Promise.resolve(null);
    }
  }

  /**
   * Return a human-readable version of the address. Format: Belgian
   */
  static formatAddress(address: IAddress | null): string {
    if (!address) {
      return '(geen adres opgegeven)'
    } else {
      return `${address.street || ''} ${address.number || ''}, ${address.zipCode || ''} ${address.city || ''}`;
    }
  }
}
