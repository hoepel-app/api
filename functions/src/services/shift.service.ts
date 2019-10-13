import * as admin from 'firebase-admin';
import { DayDate, IShift, Shift, shiftMapper, store, TenantIndexedRepository } from '@hoepel.app/types';
import { FirebaseTenantIndexedRepository } from './repository';

export type IShiftRepository = TenantIndexedRepository<Shift>;

export const createShiftRepository = (db: admin.firestore.Firestore) => new FirebaseTenantIndexedRepository<IShift, Shift>(
  db,
  store.shifts,
);

export class ShiftService {

  constructor(
    private shiftRepository: IShiftRepository,
  ) {}

  // TODO could be optimized
  async getShiftsInYear(tenant: string, year: number): Promise<ReadonlyArray<Shift>> {
    const shifts = await this.shiftRepository.getAll(tenant);
    return shifts.filter(shift => DayDate.fromDayId(shift.dayId).year === year);
  }

  // TODO could be optimized
  async getShiftsOnDay(tenant: string, day: DayDate): Promise<ReadonlyArray<Shift>> {
    const shifts = await this.shiftRepository.getAll(tenant);
    return shifts.filter(shift => shift.dayId === day.toDayId());
  }

  /**
   * Given an array of shifts, get the number of unique days (multiple shifts can happen on the same day)
   */
  static numberOfUniqueDays(shifts: ReadonlyArray<Shift>) {
    return new Set(shifts.map(shift => shift.dayId)).size;
  }
}
