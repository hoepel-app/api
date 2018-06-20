import { Callback } from '../common/callback';
import { IDayDate } from '../../docs.hoepel.app/interfaces/day-date';
import { IDetailedAttendancesOnDay } from '../../docs.hoepel.app/interfaces/detailed-attendances-on-day';
import { IDetailedAttendance } from '../../docs.hoepel.app/interfaces/detailed-attendance';
import { nano } from '../common/nano';

export class ChildAttendanceService {

  public findAttendancesForChild(opts: { dbName: string, childId: string }, callback: Callback<IDetailedAttendancesOnDay[]>) {
    const db = nano.use(opts.dbName);

    callback('error: not implemented', null);
  }

  public findNumberAttendancesForChild(opts: { dbName: string, childId: string }, callback: Callback<number>) {
    const db = nano.use(opts.dbName);

    callback('error: not implemented', null);
  }

  public findNumberOfChildAttendances(opts: { dbName: string }, callback: Callback<{ [key: string]: { [ key: string ]: number } }>) {
    const db = nano.use(opts.dbName);

    callback('error: not implemented', null);
  }

  public findNumberOfChildAttendancesOnDay(opts: { dbName: string, day:IDayDate, shiftId: string }, callback: Callback<number>) {
    const db = nano.use(opts.dbName);

    callback('error: not implemented', null);
  }

  public addAttendancesForChild(opts: { dbName: string, childId: string, day:IDayDate, shifts: string[], ageGroupName?: string }, callback: Callback<void>) {
    const db = nano.use(opts.dbName);

    callback('error: not implemented', null);
  }

  public addAttendanceForChild(opts: {
                                 dbName: string,
                                 childId: string,
                                 day: IDayDate,
                                 shift: string,
                                 ageGroupName?: string
                               },
                               callback: Callback<void>,
  ) {
    const db = nano.use(opts.dbName);

    callback('error: not implemented', null);
  }

  public removeAttendancesForChild(opts: {
    dbName: string,
    childId: string,
    day: IDayDate,
    shifts: string[]
  }, callback: Callback<void>) {
    const db = nano.use(opts.dbName);

    callback('error: not implemented', null);
  }

  public removeAttendanceForChild(opts: {
                                    dbName: string,
                                    childId: string,
                                    day: IDayDate,
                                    shift: string,
                                  }, callback: Callback<void>) {
    this.removeAttendancesForChild(Object.assign(opts, { shifts: [ opts.shift ] }), callback)
  }

  public findAll(opts: { dbName: string }, callback: Callback<{ [key: string]: IDetailedAttendancesOnDay[] }>) {
    const db = nano.use(opts.dbName);

    callback('error: not implemented', null);
  }

  public findAllPerDay(opts: { dbName: string }, callback: Callback<{ [key: string]: IDetailedAttendancesOnDay }>) {
    const db = nano.use(opts.dbName);

    callback('error: not implemented', null);
  }

  public findAllOnDay(opts: { dbName: string, dayId: string }, callback: Callback<{ [key: string]: IDetailedAttendance[] }>) {
    const db = nano.use(opts.dbName);

    callback('error: not implemented', null);
  }

  public findAllRaw(opts: { dbName: string }, callback: Callback<[ { dayId: string, shiftId: string, childId: string } ]>) {
    const db = nano.use(opts.dbName);

    callback('error: not implemented', null);
  }

  public count(opts: { dbName: string }, callback: Callback<number>) {
    const db = nano.use(opts.dbName);

    callback('error: not implemented', null);
  }
}
