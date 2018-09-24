import {slouch} from "../slouch";
import * as uuid from 'uuid';

export class GenericRepository<T extends { id?: string }> {
  constructor(
    private viewName: string,
    private kind: string,
    private designName = '_design/default',
  ) {}

  public async all(dbName: string): Promise<ReadonlyArray<T>> {
    const allDocs = [];
    await slouch.db.view(dbName, this.designName, this.viewName, { include_docs: true }).each(doc => allDocs.push(doc));

    return allDocs.map(doc => Object.assign(doc.doc.doc, { id: doc.id }));
  }

  public async byId(dbName: string, id: string): Promise<T> {
    return slouch.doc.get(dbName, id)
      .then(doc => {
        if (doc.kind !== this.kind) {
          throw { error: 'not_found', reason: '"kind" attribute does not match expected' }
        } else {
          return doc;
        }
      })
      .then(doc => Object.assign(doc.doc, { id: doc._id }));
  }

  /**
   * Create an entity in the database
   * @param dbName Name of the database to create entity in
   * @param {T} entity Entity to be created
   * @returns Promise<string> Created id
   */
  public async create(dbName: string, entity: T): Promise<string> {
    // TODO Don't accept id from the client, always regenerate. This has impact on front-end

    const { entityWithoutId, ...oldId } = entity as any;
    const id = entity.id ? entity.id : uuid.v4();

    return slouch.doc.create(dbName, this.createDoc(id, this.kind, entityWithoutId)).then(() => id);
  }

  /**
   * Update an entity in the database to a new value
   * @param dbName Name of the database to update entity in
   * @param {T} entity New entity
   * @param {string} id Id of the entity to be updated
   */
  public async update(dbName: string, entity: T, id: string): Promise<string> {
    return slouch.doc.createOrUpdateIgnoreConflict(dbName, this.createDoc(id, this.kind, entity)).then(() => id);
  }

  /**
   * Delete an entity from the database
   * @param dbName Name of the database to delete entity in
   * @param {string} id Id of the entity to be deleted
   */
  public async delete(dbName: string, id: string): Promise<string> {
    return slouch.doc.markAsDestroyed(dbName, id).then(() => id);
  };

  /**
   * Creates document with specified id, kind and optionally rev, ready to be stored in CouchDB
   * @returns Document ready to be stored into CouchDB
   */

  private createDoc(id, kind, doc, rev?) {
    return {
      _id: id,
      _rev: rev,
      doc,
      kind,
    };
  }
}
