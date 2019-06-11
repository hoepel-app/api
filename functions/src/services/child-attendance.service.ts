import * as admin from 'firebase-admin';
import { IDetailedChildAttendance, IShift } from '@hoepel.app/types';
import { CrudService } from './crud.service';

export class ChildAttendanceService {
  constructor(
    private db: admin.firestore.Firestore,
  ) {}

  async getAttendancesForChild(childId: string): Promise<{ [p: string]: IDetailedChildAttendance }> {
    const attendancesDoc = (await this.db.collection('child-attendances-by-child').doc(childId).get()).data() as
      { attendances: { [key: string]: IDetailedChildAttendance }  } | undefined;

    return  (attendancesDoc && attendancesDoc.attendances) ? attendancesDoc.attendances : {};
  }


  async getChildAttendancesOnShifts(tenant: string, shifts: ReadonlyArray<IShift>): Promise<ReadonlyArray<{
    shiftId: string,
    attendances: ReadonlyArray<IDetailedChildAttendance>
  }>> {
    const docs = shifts.map(shift => this.db.collection('child-attendances-by-shift').doc(shift.id));
    const all = await this.db.getAll(...docs);

    return all.filter(snapshot => snapshot.exists && snapshot.data().attendances && snapshot.data().tenant === tenant).map(snapshot => {
      return {
        shiftId: snapshot.id,
        attendances: snapshot.data().attendances,
      };
    });
  };

}
