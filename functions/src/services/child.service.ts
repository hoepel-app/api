import * as admin from 'firebase-admin';
import { Child, IChild } from '@hoepel.app/types';
import dropTenant from '../util/drop-tenant';
import { CrudService } from './crud.service';

export class ChildService extends CrudService<Child, IChild> {
  collectionName = 'children';

  constructor(
    db: admin.firestore.Firestore,
  ) {
    super(db);
  }

  lift(obj: IChild): Child {
    return new Child(obj);
  }
}
