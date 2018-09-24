import { groupBy, mapValues, toPairs, flatMap, map, uniq, fromPairs } from 'lodash';
import { IDetailedAttendance, IDetailedAttendancesOnDay } from 'types.hoepel.app';
import { slouch } from '../slouch';

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
  public async findAttendancesForChild(opts: { dbName: string, childId: string }): Promise<ReadonlyArray<IDetailedAttendancesOnDay>> {
    const all = await this.findAll(opts);

    if (all[opts.childId]) {
      return all[opts.childId];
    } else {
      return [];
    }
  }

  public async findNumberOfChildAttendances(opts: { dbName: string }): Promise<{ [key: string]: { [ key: string ]: number } }> {
    const allRaw = await this.findAllRaw(opts);

    const groupedByDay = groupBy(allRaw, row => row.dayId);

    return mapValues(groupedByDay, (value) => {
        const groupedByShift = groupBy(value, x => x.shiftId);
        return mapValues(groupedByShift, x => x.length);
    });
  }

  public async addAttendancesForChild(opts: { dbName: string, childId: string, dayId: string, shifts: string[], ageGroupName?: string }): Promise<void> {

    const docsToInsert = opts.shifts.map(shiftId => {
      const detailedAttendance: PersistedDetailedAttendance = { ageGroupName: opts.ageGroupName, enrolled: new Date().toISOString() };

      return {
        doc: detailedAttendance,
        kind: 'type/childattendance/v2',
        _id: createChildAttendanceId(opts.dayId, shiftId, opts.childId),
      }
    });

    return slouch.doc.bulkCreateOrUpdate(opts.dbName, docsToInsert);
  }

  public addAttendanceForChild(opts: {
                                 dbName: string,
                                 childId: string,
                                 dayId: string,
                                 shift: string,
                                 ageGroupName?: string
                               },
  ): Promise<void> {
    return this.addAttendancesForChild({
      dbName: opts.dbName,
      childId: opts.childId,
      dayId: opts.dayId,
      shifts: [ opts.shift ],
      ageGroupName: opts.ageGroupName,
    })
  }

  public removeAttendancesForChild(opts: {
    dbName: string,
    childId: string,
    dayId: string,
    shifts: string[]
  }): Promise<{ deleted: string[], notFound: string[] }> {

    const docsToDelete = opts.shifts.map(shiftId =>  createChildAttendanceId(opts.dayId, shiftId, opts.childId));

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

  public removeAttendanceForChild(opts: {
                                    dbName: string,
                                    childId: string,
                                    dayId: string,
                                    shift: string,
                                  }): Promise<{ deleted: string[], notFound: string[] }> {
    return this.removeAttendancesForChild(Object.assign(opts, { shifts: [ opts.shift ] }));
  }

  public async findAll(opts: { dbName: string }): Promise<{ [key: string]: IDetailedAttendancesOnDay[] }> {
    const allDocs = [];
    await slouch.db.view(opts.dbName, '_design/default', 'all-child-attendances', { include_docs: true }).each(doc => allDocs.push(doc));

    // Get all detailed attendances
    const detailedAttendances = allDocs.map(row => this.createDetailedAttendancesOnDay(row.id, row.doc.doc));

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
            uniqueChildren: uniq(map(allRaw, obj => obj.childId)).length,
        }
    });

    // 'day' property is missing but we know it: it's the objects' keys
    const dayAdded = fromPairs(toPairs(res).map(([ key, value ]) => [ key, Object.assign(value, { day: key }) ]));

    return dayAdded;
  }

  public async findAllOnDay(opts: { dbName: string, dayId: string }): Promise<ReadonlyArray<{ childId: string, attendances: ReadonlyArray<IDetailedAttendance> }>> {
    // TODO can be done more efficiently using start_key and end_key but doesn't seem to work with Nano...
    // TODO Currently very inefficient! Gets ALL docs from DB

    const allDocs = [];
    await slouch.db.view(opts.dbName, '_design/default', 'all-child-attendances', { include_docs: true }).each(doc => allDocs.push(doc));

    const data = allDocs.map(row => { return { ids: createFromChildAttendanceId(row.id), details: row.doc.doc } });
    const groupedByChild = groupBy(data.filter(el => el.ids.dayId === opts.dayId), el => el.ids.childId);

    const res = toPairs(groupedByChild).map(( [childId, docs] ) => {
      return {
        childId,
        attendances: docs.map(doc => Object.assign(doc.details, { shiftId: doc.ids.shiftId })),
      }
    });

    return res.map(el => {
      return { childId: el.childId, attendances: el.attendances };
    });
  }

  public async findAllRaw(opts: { dbName: string }): Promise<ReadonlyArray<{ dayId: string, shiftId: string, childId: string }>> {
    const allDocs = [];
    await slouch.db.view(opts.dbName, '_design/default', 'all-child-attendances').each(doc => allDocs.push(createFromChildAttendanceId(doc.id)));
    return allDocs;
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
