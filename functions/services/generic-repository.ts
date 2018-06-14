import { nano } from '../common/nano';
import * as uuid from 'uuid/v4';

export type Callback<T> = (err, T) => void;

export class GenericRepository<T> {
  constructor(
    private viewName: string,
    private kind: string,
    private designName = 'default',

  ) {}

  public all(dbName: string, callback: Callback<ReadonlyArray<T>>) {
    const db = nano.use(dbName);

    db.view(this.designName, this.viewName, { include_docs: true }, (err, data) => {
      if (err) {
        callback(err, null);
      } else {
        console.log('data', data);
        const docs = data.rows.map(row => Object.assign(row.doc.doc, { id: row.doc._id }) );
        console.log('docs',docs);
        callback(null, docs);
      }
    });
  }

  public byId(dbName: string, id: string, callback: Callback<T>) {
    const db = nano.use(dbName);

    db.get(id, (err, data) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, Object.assign(data.doc, { id: data._id }));
      }
    });
  }

  /**
   * Create an entity in the database
   * @param dbName Name of the database to create entity in
   * @param {T} entity Entity to be created
   * @param {Callback<string>} callback Callback with the created id as a parameter
   */
  public create(dbName: string, entity: T, callback: Callback<string>) {
    const db = nano.use(dbName);

    db.insert(this.createDoc(uuid(), this.kind, entity), (err, res) => {
      if (err) {
        callback(err, null);
        return;
      } else {
        callback(null, res.id);
      }
    });
  }

  /**
   * Update an entity in the database to a new value
   * @param dbName Name of the database to update entity in
   * @param {T} entity New entity
   * @param {string} id Id of the entity to be updated
   * @param {Callback<>} callback Callback with the id of the updated entity
   */
  public update(dbName: string, entity: T, id: string, callback: Callback<string>) {
    const db = nano.use(dbName);

    db.get(id, (err, data) => {
      if (err) {
        callback(err, null);
      } else {
        db.insert(this.createDoc(id, this.kind, entity, data._rev), (err, res) => {
          if (err) {
            callback(err, null);
          } else {
            callback(null, res.id);
          }
        });
      }
    });
  }

  /**
   * Delete an entity from the database
   * @param dbName Name of the database to delete entity in
   * @param {string} id Id of the entity to be deleted
   * @param {Callback<string>} callback Callback with the deleted id as a parameters
   */
  public delete(dbName: string, id: string, callback: Callback<string>) {
    const db = nano.use(dbName);

    db.get(id, (err, data) => {
      if (err) {
        callback(err, null);
      } else {
        db.destroy(id, data._rev, (err, res) => {
          if (err) {
            callback(err, null)
          } else {
            callback(null, res.id)
          }
        });
      }
    });
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
