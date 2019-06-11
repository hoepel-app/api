import * as admin from 'firebase-admin';
import { CrudService } from './crud.service';
import { Crew, ICrew } from '@hoepel.app/types';

export class CrewService extends CrudService<Crew, ICrew> {
  collectionName = 'crew-members';

  constructor(
    db: admin.firestore.Firestore,
  ) {
    super(db);
  }

  lift(obj: ICrew) {
    return new Crew(obj)
  };
}
