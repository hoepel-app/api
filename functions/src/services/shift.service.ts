import * as admin from 'firebase-admin';
import { IShift, Shift } from '@hoepel.app/types';
import dropTenant from '../util/drop-tenant';

export class ShiftService {
  constructor(
    private db: admin.firestore.Firestore,
  ) {
  }

  async getMany(tenant: string, shiftIds: ReadonlyArray<string>): Promise<ReadonlyArray<Shift>> {
    // tslint:disable:no-unnecessary-type-assertion

    if (shiftIds.length > 0) {
      const id2doc = (id: string) => this.db.collection('shifts').doc(id);

      const shifts = (await this.db.getAll(id2doc(shiftIds[0]), ...shiftIds.slice(1).map(id2doc))) // can't do ...shiftIds.map(id2doc) due to some TS error
        .map(snapshot => ({...snapshot.data(), id: snapshot.id} as IShift & { tenant: string }))
        .filter(ishift => ishift.tenant === tenant)
        .map(ishift => new Shift(dropTenant(ishift)));

      return Shift.sort(shifts);
    } else {
      return Promise.resolve([]);
    }
  }

  /**
   * Given an array of shifts, get the number of unique days (multiple shifts can happen on the same day)
   */
  static numberOfUniqueDays(shifts: ReadonlyArray<Shift>) {
    return new Set(shifts.map(shift => shift.dayId)).size;
  }
}
