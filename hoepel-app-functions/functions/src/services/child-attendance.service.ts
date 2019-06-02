import * as admin from 'firebase-admin';
import { IDetailedChildAttendance } from '@hoepel.app/types';

export class ChildAttendanceService {
  constructor(
    private db: admin.firestore.Firestore,
  ) {}

  async getAttendancesForChild(childId: string): Promise<{ [p: string]: IDetailedChildAttendance }> {
    const attendancesDoc = (await this.db.collection('child-attendances-by-child').doc(childId).get()).data() as
      { attendances: { [key: string]: IDetailedChildAttendance }  } | undefined;

    return  (attendancesDoc && attendancesDoc.attendances) ? attendancesDoc.attendances : {};
  }

}
