import { Callback } from '../common/callback';
import { IDetailedAttendancesOnDay } from '../../docs.hoepel.app/interfaces/detailed-attendances-on-day';
import { IDetailedAttendance } from '../../docs.hoepel.app/interfaces/detailed-attendance';
import { nano } from '../common/nano';
import { groupBy, mapValues, toPairs, flatMap, map, uniq } from 'lodash';

interface PersistedDetailedAttendance {
  /** When the crew was enrolled (intention to participate in an activity)
   *  Format: JS date (e.g. 2018-04-13T11:14:54.411Z)
   */
  enrolled?: string;

  /**
   * Who registered the crew's intent to participate in an activity
   * Crew id
   */
  enrolledRegisteredBy?: string;

  /**
   * When the crew arrived to participate in an activity
   * Format: JS date, e.g. 2018-04-13T11:14:54.411Z
   */
  arrived?: string;

  /**
   * Which crew member registered the crew as arrived
   * Crew id
   */
  arrivedRegisteredBy?: string;

  /**
   * When the crew left/went home after the activity
   * Format: JS date, e.g. 2018-04-13T11:14:54.411Z
   */
  left?: string;

  /**
   * Who registered the crew leaving
   * Crew id
   */
  leftRegisteredBy?: string;
}

const createFromCrewAttendanceId = (crewAttendanceId: string): { dayId: string, shiftId: string, crewId: string } => {
  const split = crewAttendanceId.split("--");

  return {
    dayId: split[0],
    shiftId: split[1],
    crewId: split[2],
  };
};

const createCrewAttendanceId = (dayId: string, shiftId: string, crewId: string) => {
  return dayId + '--' + shiftId + '--' + crewId;
};

export class CrewAttendanceService {

  public findAttendancesForCrew(opts: { dbName: string, crewId: string }, callback: Callback<IDetailedAttendancesOnDay[]>) {
    // TODO this can be done more efficiently
    this.findAll({ dbName: opts.dbName }, (err, data) => {
      if (err) {
        callback(err, null);
      } else {
        if (data[opts.crewId]) {
          callback(null, data[opts.crewId]);
        } else {
          callback(null, []);
        }
      }
    });
  }

  public findNumberOfCrewAttendances(opts: { dbName: string }, callback: Callback<{ [key: string]: { [ key: string ]: number } }>) {
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

  public addAttendancesForCrew(opts: { dbName: string, crewId: string, dayId: string, shifts: string[] }, callback: Callback<void>) {
    const db = nano.use(opts.dbName);

    const docsToInsert = opts.shifts.map(shiftId => {
      const detailedAttendance: PersistedDetailedAttendance = { enrolled: new Date().toISOString() };

      return {
        doc: detailedAttendance,
        kind: 'type/crewattendance/v2',
        _id: createCrewAttendanceId(opts.dayId, shiftId, opts.crewId),
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

  public addAttendanceForCrew(opts: {
                                 dbName: string,
                                 crewId: string,
                                 dayId: string,
                                 shift: string,
                               },
                               callback: Callback<void>,
  ) {
    this.addAttendancesForCrew({
      dbName: opts.dbName,
      crewId: opts.crewId,
      dayId: opts.dayId,
      shifts: [ opts.shift ],
    }, callback)
  }

  public removeAttendancesForCrew(opts: {
    dbName: string,
    crewId: string,
    dayId: string,
    shifts: string[]
  }, callback: Callback<void>) {
    const db = nano.use(opts.dbName);

    const docsToDelete = opts.shifts.map(shiftId =>  createCrewAttendanceId(opts.dayId, shiftId, opts.crewId));

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

  public removeAttendanceForCrew(opts: {
    dbName: string,
    crewId: string,
    dayId: string,
    shift: string,
  }, callback: Callback<void>) {
    this.removeAttendancesForCrew(Object.assign(opts, { shifts: [ opts.shift ] }), callback)
  }

  public findAll(opts: { dbName: string }, callback: Callback<{ [key: string]: IDetailedAttendancesOnDay[] }>) {
    const db = nano.use(opts.dbName);

    db.view('default', 'all-crew-attendances', { include_docs: true }, (err, data) => {
      if (err) {
        callback(err, null);
      } else {
        // Get all detailed attendances
        const detailedAttendances = data.rows.map(row => this.createDetailedAttendancesOnDay(row.id, row.doc.doc));

        // Group by crew id
        const grouped = groupBy(detailedAttendances, att => att.crewId);

        // reduce all detailed attendances on day for a crew to a single one
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

        callback(null, mapped);
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
              numAttendances: value.length
            }
          });

          return {
            shiftsWithAttendances,
            uniqueCrewren: uniq(map(data, obj => obj.crewId)).length
          }
        });

        callback(null, res);
      }
    });
  }

  public findAllOnDay(opts: { dbName: string, dayId: string }, callback: Callback<{ [key: string]: IDetailedAttendance[] }>) {
    // TODO can be done more efficiently using start_key and end_key but doesn't seem to work with Nano...
    // TODO Currenty very inefficient! Gets ALL docs from DB

    const db = nano.use(opts.dbName);

    db.view('default', 'all-crew-attendances', { include_docs: true }, (err, response) => {
      if (err) {
        callback(err, null);
      } else {
        const data = response.rows.map(row => { return { ids: createFromCrewAttendanceId(row.id), details: row.doc.doc } });
        const groupedByCrew = groupBy(data.filter(el => el.ids.dayId === opts.dayId), el => el.ids.crewId);

        const res = toPairs(groupedByCrew).map(( [crewId, docs] ) => {
          return {
            crewId,
            attendances: docs.map(doc => Object.assign(doc.details, { shiftId: doc.ids.shiftId })),
          }
        });

        callback(null, res);
      }
    });
  }

  public findAllRaw(opts: { dbName: string }, callback: Callback<[ { dayId: string, shiftId: string, crewId: string } ]>) {
    const db = nano.use(opts.dbName);

    db.view('default', 'all-crew-attendances', (err, response) => {
      if (err) {
        callback(err, null);
      } else {
        const data = response.rows.map(row => createFromCrewAttendanceId(row.id));
        callback(null, data);
      }
    });
  }

  public count(opts: { dbName: string }, callback: Callback<number>) {
    const db = nano.use(opts.dbName);

    db.view('all-crew-attendances-count', 'default', { group: true, reduce: true }, (err, data) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, data.rows[0].value)
      }
    });
  }

  private createDetailedAttendancesOnDay(crewAttendanceId: string, document: PersistedDetailedAttendance): { crewId: string, detailedAttendancesOnDay: IDetailedAttendancesOnDay } {
    const ids = createFromCrewAttendanceId(crewAttendanceId);

    return {
      crewId: ids.crewId,
      detailedAttendancesOnDay: {
        day: ids.dayId,
        shifts: [Object.assign(document, {shiftId: ids.shiftId})],
      },
    };
  }
}
