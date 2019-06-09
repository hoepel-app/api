import { expect } from 'chai';
import * as sinon from 'sinon';
import { AddressService } from './address.service';
import { Address, Child, ContactPerson } from '@hoepel.app/types';
import { ContactPersonService } from './contact-person.service';

describe('AddressService#getAddressForChild', () => {
  it('Get address from child when it is valid', async () => {
    const contactPersonService = new ContactPersonService(undefined);
    const addressService = new AddressService(contactPersonService);

    const child = Child.empty().withAddress(new Address({
      city: 'city1', street: 'street1', number: 'number1', zipCode: 12345
    }));

    const address = await addressService.getAddressForChild('tenant1', child);

    expect(address.city).to.equal('city1');
    expect(address.street).to.equal('street1');
    expect(address.number).to.equal('number1');
    expect(address.zipCode).to.equal(12345);
  });

  it('Get address from primary contact person when child has no valid address', async () => {
    const stub = sinon.stub(ContactPersonService.prototype, 'get').callsFake((tenant: string, id: string) => {
      if (tenant === 'tenant2' && id === 'id-123') {
        return Promise.resolve(new ContactPerson({
          firstName: 'test', lastName: 'test',
          address: { street: 'contact street 1', number: 'contact number 1', city: 'contact city 1', zipCode: 654 },
          phone: [],
          email: [],
          remarks: '',
        }));
      } else {
        throw new Error('Unexpected contact person id');
      }
    });

    const contactPersonService = new ContactPersonService(undefined);
    const addressService = new AddressService(contactPersonService);

    const child = Child.empty().withAddress(new Address({
      street: 'some street',
    })).withContactPeople([
      { contactPersonId: 'id-123', relationship: 'rel' },
      { contactPersonId: 'id-456', relationship: 'rel' },
    ]);

    expect(child.primaryContactPerson.contactPersonId).to.equal('id-123');
    expect(child.address.isValid).to.be.false;

    const address = await addressService.getAddressForChild('tenant2', child);

    expect(address.city).to.equal('contact city 1');
    expect(address.street).to.equal('contact street 1');
    expect(address.number).to.equal('contact number 1');
    expect(address.zipCode).to.equal(654);

    stub.restore();
  });
});
