import { AgeGroup } from 'types.hoepel.app';
import { slouch } from '../slouch';

export class AgeGroupsService {
  private static databaseId = "age-group-config";
  private static kind = 'type/ageGroup/v1';

  constructor() {}

  public getAll(dbName: string): Promise<ReadonlyArray<AgeGroup>> {
    return slouch.doc.getIgnoreMissing(dbName, AgeGroupsService.databaseId).then(doc => {
      if (doc && doc.doc && doc.doc.groups) {
        return doc.doc.groups;
      } else {
        return [];
      }
    });
  }

  public createOrUpdate(dbName: string, allAgeGroups: ReadonlyArray<AgeGroup>): Promise<void> {
    const docToUpsert = {
        '_id': AgeGroupsService.databaseId,
        doc: {
            groups: allAgeGroups
        },
        kind: AgeGroupsService.kind,
    };

    return slouch.doc.createOrUpdateIgnoreConflict(dbName, docToUpsert);
  }
}
