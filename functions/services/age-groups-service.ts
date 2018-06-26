import { AgeGroup } from '../../docs.hoepel.app/interfaces/age-group';
import { Callback } from '../common/callback';
import { nano } from '../common/nano';

export class AgeGroupsService {
  private static databaseId = "age-group-config";
  private static kind = 'type/ageGroup/v1';

  constructor() {}

  public getAll(dbName: string, callback: Callback<ReadonlyArray<AgeGroup>>) {
    const db = nano.use(dbName);

    db.get(AgeGroupsService.databaseId, (err, doc) => {
      if (err && err.error && err.error === 'not_found') {
        callback(null, []);
      } else if (err) {
        callback(err, null);
      } else {
        console.log(doc);

        if (doc.doc && doc.doc.groups) {
          callback(null, doc.doc.groups);
        } else {
          callback(null, []);
        }
      }
    });
  }

  public createOrUpdate(dbName: string, allAgeGroups: ReadonlyArray<AgeGroup>, callback: Callback<void>) {
    const db = nano.use(dbName);

    const docToUpsert = {
      '_id': AgeGroupsService.databaseId,
      doc: {
        groups: allAgeGroups
      },
      kind: AgeGroupsService.kind,
    };

    db.get(AgeGroupsService.databaseId, (errGet, doc) => {
      if (errGet && errGet.error === 'not_found') {
        // Doc doesn't exist, create it
        // TODO what if the 'not_found' was thrown because db doesn't exist?

        db.insert(docToUpsert, (errInsert, resultInsert) => {
          callback(errInsert, resultInsert);
        });

      } else if (errGet) {
        callback(errGet, null);

      } else {
        // Update doc

        db.insert(Object.assign(docToUpsert,{ _rev: doc._rev }), (errUpdate, resultUpdate) => {
          callback(null, resultUpdate);
        });
      }
    })
  }
}
