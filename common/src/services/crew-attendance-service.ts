import { groupBy, mapValues, toPairs, flatMap, map, uniq, fromPairs } from 'lodash';
import { IDetailedAttendance, IDetailedAttendancesOnDay } from 'types.hoepel.app';
import { slouch } from '../slouch';

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
  const split = crewAttendanceId.split('--');

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

  public async findAttendancesForCrew(opts: { dbName: string, crewId: string }): Promise<ReadonlyArray<IDetailedAttendancesOnDay>> {
    // TODO this can be done more efficiently
    const all = await this.findAll(opts);

    if (all[opts.crewId]) {
      return all[opts.crewId];
    } else {
      return [];
    }
  }

  public async findNumberOfCrewAttendances(opts: { dbName: string }): Promise<{ [key: string]: { [ key: string ]: number } }> {
    const allRaw = await this.findAllRaw(opts);

    const groupedByDay = groupBy(allRaw, row => row.dayId);

    return mapValues(groupedByDay, (value) => {
      const groupedByShift = groupBy(value, x => x.shiftId);
      return mapValues(groupedByShift, x => x.length);
    });
  }

  public addAttendancesForCrew(opts: { dbName: string, crewId: string, dayId: string, shifts: string[] }): Promise<void> {
    const docsToInsert = opts.shifts.map(shiftId => {
      const detailedAttendance: PersistedDetailedAttendance = { enrolled: new Date().toISOString() };

      return {
        doc: detailedAttendance,
        kind: 'type/crewattendance/v2',
        _id: createCrewAttendanceId(opts.dayId, shiftId, opts.crewId),
      }
    });

    return slouch.doc.bulkCreateOrUpdate(opts.dbName, docsToInsert);
  }

  public async addAttendanceForCrew(opts: {
                                 dbName: string,
                                 crewId: string,
                                 dayId: string,
                                 shift: string,
                               }): Promise<void> {
    return this.addAttendancesForCrew({
      dbName: opts.dbName,
      crewId: opts.crewId,
      dayId: opts.dayId,
      shifts: [ opts.shift ],
    })
  }

  public removeAttendancesForCrew(opts: {
    dbName: string,
    crewId: string,
    dayId: string,
    shifts: string[]
  }): Promise<{ deleted: string[], notFound: string[] }> {

    const docsToDelete = opts.shifts.map(shiftId =>  createCrewAttendanceId(opts.dayId, shiftId, opts.crewId));

    const deletions = docsToDelete.map(docId => {
      return slouch.doc
        .upsert(opts.dbName, { _id: docId, _deleted: true })
        .then(() => { return { deleted: docId } })
        .catch(e => { return { notFound: docId } });
    });

    return Promise.all(deletions).then(results => {
      return {
        deleted: results.filter(doc => doc.deleted).map(doc => doc.deleted),
        notFound: results.filter(doc => doc.notFound).map(doc => doc.notFound)
      }
    });
  }

  public async removeAttendanceForCrew(opts: {
    dbName: string,
    crewId: string,
    dayId: string,
    shift: string,
  }): Promise<{ deleted: string[], notFound: string[] }> {
    return this.removeAttendancesForCrew(Object.assign(opts, { shifts: [ opts.shift ] }));
  }

  public async findAll(opts: { dbName: string }): Promise<{ [key: string]: IDetailedAttendancesOnDay[] }> {
    const allDocs = [];
    await slouch.db.view(opts.dbName, '_design/default', 'all-crew-attendances', { include_docs: true }).each(doc => allDocs.push(doc));

    // Get all detailed attendances
    const detailedAttendances = allDocs.map(row => this.createDetailedAttendancesOnDay(row.id, row.doc.doc));

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

    return fromPairs(mapped.map(el => [ el.day, el.shifts ]));
  }

  public async findAllPerDay(opts: { dbName: string }): Promise<{ [key: string]: IDetailedAttendancesOnDay }> {
    const allRaw = await this.findAllRaw(opts);

    const groupedByDay = groupBy(allRaw, obj => obj.dayId);

    const res = mapValues(groupedByDay, value => {
      const shiftsWithAttendances = toPairs(groupBy(value, obj => obj.shiftId)).map( ([ shiftId, value ]) => {
        return {
          shiftId,
          numAttendances: value.length,
        }
      });

      return {
        shiftsWithAttendances,
        uniqueCrew: uniq(map(allRaw, obj => obj.crewId)).length,
      }
    });

    // 'day' property is missing but we know it: it's the objects' keys
    const dayAdded = fromPairs(toPairs(res).map(([ key, value ]) => [ key, Object.assign(value, { day: key }) ]));

    return dayAdded;
  }

  public async findAllOnDay(opts: { dbName: string, dayId: string }): Promise<{ [key: string]: IDetailedAttendance[] }> {
    // TODO can be done more efficiently using start_key and end_key but doesn't seem to work with Nano...
    // TODO Currenty very inefficient! Gets ALL docs from DB

    const allDocs = [];
    await slouch.db.view(opts.dbName, '_design/default', 'all-crew-attendances', { include_docs: true }).each(doc => allDocs.push(doc));

    const data = allDocs.map(row => { return { ids: createFromCrewAttendanceId(row.id), details: row.doc.doc } });

    const groupedByCrew = groupBy(data.filter(el => el.ids.dayId === opts.dayId), el => el.ids.crewId);

    const res = toPairs(groupedByCrew).map(( [crewId, docs] ) => {
      return {
        crewId,
        attendances: docs.map(doc => Object.assign(doc.details, { shiftId: doc.ids.shiftId })),
      }
    });

    return fromPairs(res.map(el => [ el.crewId, el.attendances ]));
  }

  public async findAllRaw(opts: { dbName: string }): Promise<ReadonlyArray<{ dayId: string, shiftId: string, crewId: string }>> {
    const allDocs = [];
    await slouch.db.view(opts.dbName, '_design/default', 'all-crew-attendances').each(doc => allDocs.push(createFromCrewAttendanceId(doc.id)));
    return allDocs;
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
