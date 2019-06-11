import * as admin from 'firebase-admin';
import { IShift, Shift } from '@hoepel.app/types';
import dropTenant from '../util/drop-tenant';
import { CrudService } from './crud.service';

export class ShiftService extends CrudService<Shift, IShift> {
  collectionName = 'shifts';

  constructor(
    db: admin.firestore.Firestore,
  ) {
    super(db);
  }

  lift(obj: IShift): Shift {
    return new Shift(obj);
  }

  /**
   * Given an array of shifts, get the number of unique days (multiple shifts can happen on the same day)
   */
  static numberOfUniqueDays(shifts: ReadonlyArray<Shift>) {
    return new Set(shifts.map(shift => shift.dayId)).size;
  }
}
