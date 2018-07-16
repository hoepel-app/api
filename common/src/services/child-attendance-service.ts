import { Callback } from '../callback';
import { nano } from '../nano';
import { groupBy, mapValues, toPairs, flatMap, map, uniq, fromPairs } from 'lodash';
import { IDetailedAttendance, IDetailedAttendancesOnDay } from 'types.hoepel.app';

interface PersistedDetailedAttendance {
  /** When the child was enrolled (intention to participate in an activity)
   *  Format: JS date (e.g. 2018-04-13T11:14:54.411Z)
   */
  enrolled?: string;

  /**
   * Who registered the child's intent to participate in an activity
   * Crew id
   */
  enrolledRegisteredBy?: string;

  /**
   * When the child arrived to participate in an activity
   * Format: JS date, e.g. 2018-04-13T11:14:54.411Z
   */
  arrived?: string;

  /**
   * Which crew member registered the child as arrived
   * Crew id
   */
  arrivedRegisteredBy?: string;

  /**
   * When the child left/went home after the activity
   * Format: JS date, e.g. 2018-04-13T11:14:54.411Z
   */
  left?: string;

  /**
   * Who registered the child leaving
   * Crew id
   */
  leftRegisteredBy?: string;

  /**
   * If child is part of an age group
   */
  ageGroupName?: string;
}

const createFromChildAttendanceId = (childAttendanceId: string): { dayId: string, shiftId: string, childId: string } => {
  const split = childAttendanceId.split('--');

  return {
    dayId: split[0],
    shiftId: split[1],
    childId: split[2],
  };
};

const createChildAttendanceId = (dayId: string, shiftId: string, childId: string) => {
  return dayId + '--' + shiftId + '--' + childId;
};

export class ChildAttendanceService {

  public findAttendancesForChild(opts: { dbName: string, childId: string }, callback: Callback<IDetailedAttendancesOnDay[]>) {
    // TODO this can be done more efficiently
    this.findAll({ dbName: opts.dbName }, (err, data) => {
      if (err) {
        callback(err, null);
      } else {
        if (data[opts.childId]) {
          callback(null, data[opts.childId]);
        } else {
          callback(null, []);
        }
      }
    });
  }

  public findNumberOfChildAttendances(opts: { dbName: string }, callback: Callback<{ [key: string]: { [ key: string ]: number } }>) {
    this.findAllRaw({ dbName: opts.dbName }, (err, data) => {
      if(err) {
        callback(err, null);
      } else {
        const groupedByDay = groupBy(data, row => row.dayId);

        const res = mapValues(groupedByDay, (value) => {
          const groupedByShift = groupBy(value, x => x.shiftId);

          return mapValues(groupedByShift, x => x.length);
        });

        callback(null, res);
      }
    });
  }

  public addAttendancesForChild(opts: { dbName: string, childId: string, dayId: string, shifts: string[], ageGroupName?: string }, callback: Callback<void>) {
    const db = nano.use(opts.dbName);

    const docsToInsert = opts.shifts.map(shiftId => {
      const detailedAttendance: PersistedDetailedAttendance = { ageGroupName: opts.ageGroupName, enrolled: new Date().toISOString() };

      return {
        doc: detailedAttendance,
        kind: 'type/childattendance/v2',
        _id: createChildAttendanceId(opts.dayId, shiftId, opts.childId),
      }
    });

    db.bulk({ docs: docsToInsert },(err, response) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, response);
      }
    });
  }

  public addAttendanceForChild(opts: {
                                 dbName: string,
                                 childId: string,
                                 dayId: string,
                                 shift: string,
                                 ageGroupName?: string
                               },
                               callback: Callback<void>,
  ) {
    this.addAttendancesForChild({
      dbName: opts.dbName,
      childId: opts.childId,
      dayId: opts.dayId,
      shifts: [ opts.shift ],
      ageGroupName: opts.ageGroupName,
    }, callback)
  }

  public removeAttendancesForChild(opts: {
    dbName: string,
    childId: string,
    dayId: string,
    shifts: string[]
  }, callback: Callback<{ deleted: string[], notFound: string[] }>) {
    const db = nano.use(opts.dbName);

    const docsToDelete = opts.shifts.map(shiftId =>  createChildAttendanceId(opts.dayId, shiftId, opts.childId));

    db.fetchRevs({ keys: docsToDelete }, (err, response) => {
      if (err) {
        callback(err, null);
        return;
      }

      const notFound = response.rows.filter(row => row.error === 'not_found').map(row => row.key);

      const toDelete = response.rows.filter(row => row.id && !row.error && row.value && row.value.rev).map(row => {
        return {
          _id: row.id,
          _rev: row.value.rev,
          _deleted: true,
        };
      });

      db.bulk({ docs: toDelete }, (err_bulk, data) => {
        if (err_bulk) {
          callback(err_bulk, null);
        } else {
          callback(null, { deleted: toDelete.map(doc => doc._id), notFound });
        }
      });
    })
  }

  public removeAttendanceForChild(opts: {
                                    dbName: string,
                                    childId: string,
                                    dayId: string,
                                    shift: string,
                                  }, callback: Callback<{ deleted: string[], notFound: string[] }>) {
    this.removeAttendancesForChild(Object.assign(opts, { shifts: [ opts.shift ] }), callback)
  }

  public findAll(opts: { dbName: string }, callback: Callback<{ [key: string]: IDetailedAttendancesOnDay[] }>) {
    const db = nano.use(opts.dbName);

    db.view('default', 'all-child-attendances', { include_docs: true }, (err, data) => {
      if (err) {
        callback(err, null);
      } else {
        // Get all detailed attendances
        const detailedAttendances = data.rows.map(row => this.createDetailedAttendancesOnDay(row.id, row.doc.doc));

        // Group by child id
        const grouped = groupBy(detailedAttendances, att => att.childId);

        // reduce all detailed attendances on day for a child to a single one
        const object = mapValues(grouped, value => {
          const detailedAttendancesReduced = mapValues(groupBy(value.map(att => att.detailedAttendancesOnDay), 'day'), arrayOfDetailedAttendancesOnDay => {
            return flatMap(arrayOfDetailedAttendancesOnDay, element => element.shifts);
          });

          return detailedAttendancesReduced;
        });

        // map { a: value } to { day: a, shifts: value }
        const mapped = map(toPairs(object), array => {
          return {
            day: array[0],
            shifts: array[1],
          }
        });

        callback(null, fromPairs(mapped.map(el => [ el.day, el.shifts ])));
      }
    });
  }

  public findAllPerDay(opts: { dbName: string }, callback: Callback<{ [key: string]: IDetailedAttendancesOnDay }>) {    const db = nano.use(opts.dbName);
    this.findAllRaw({ dbName:opts.dbName }, (err, data) => {
      if (err) {
        callback(err, null);
      } else {
        const groupedByDay = groupBy(data, obj => obj.dayId);

        const res = mapValues(groupedByDay, value => {
          const shiftsWithAttendances = toPairs(groupBy(value, obj => obj.shiftId)).map( ([ shiftId, value ]) => {
            return {
              shiftId,
              numAttendances: value.length,
            }
          });

          return {
            shiftsWithAttendances,
            uniqueChildren: uniq(map(data, obj => obj.childId)).length,
          }
        });

        // 'day' property is missing but we know have: it's the objects' keys
        const dayAdded = fromPairs(toPairs(res).map(([ key, value ]) => [ key, Object.assign(value, { day: key }) ]));

        callback(null, dayAdded);
      }
    });
  }

  public findAllOnDay(opts: { dbName: string, dayId: string }, callback: Callback<{ [key: string]: IDetailedAttendance[] }>) {
    // TODO can be done more efficiently using start_key and end_key but doesn't seem to work with Nano...
    // TODO Currenty very inefficient! Gets ALL docs from DB

    const db = nano.use(opts.dbName);

    db.view('default', 'all-child-attendances', { include_docs: true }, (err, response) => {
      if (err) {
        callback(err, null);
      } else {
        const data = response.rows.map(row => { return { ids: createFromChildAttendanceId(row.id), details: row.doc.doc } });
        const groupedByChild = groupBy(data.filter(el => el.ids.dayId === opts.dayId), el => el.ids.childId);

        const res = toPairs(groupedByChild).map(( [childId, docs] ) => {
          return {
            childId,
            attendances: docs.map(doc => Object.assign(doc.details, { shiftId: doc.ids.shiftId })),
          }
        });

        callback(null, fromPairs(res.map(el => [ el.childId, el.attendances ])));
      }
    });
  }

  public findAllRaw(opts: { dbName: string }, callback: Callback<[ { dayId: string, shiftId: string, childId: string } ]>) {
    const db = nano.use(opts.dbName);

    db.view('default', 'all-child-attendances', (err, response) => {
      if (err) {
        callback(err, null);
      } else {
        const data = response.rows.map(row => createFromChildAttendanceId(row.id));
        callback(null, data);
      }
    });
  }

  public count(opts: { dbName: string }, callback: Callback<number>) {
    const db = nano.use(opts.dbName);

    db.view('all-child-attendances-count', 'default', { group: true, reduce: true }, (err, data) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, data.rows[0].value)
      }
    });
  }

  private createDetailedAttendancesOnDay(childAttendanceId: string, document: PersistedDetailedAttendance): { childId: string, detailedAttendancesOnDay: IDetailedAttendancesOnDay } {
    const ids = createFromChildAttendanceId(childAttendanceId);

    return {
      childId: ids.childId,
      detailedAttendancesOnDay: {
        day: ids.dayId,
        shifts: [Object.assign(document, {shiftId: ids.shiftId})],
      },
    };
  }
}
