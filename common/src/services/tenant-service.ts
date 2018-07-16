import { nano } from '../nano';
import { Callback } from '../callback';
import { createDbName, dbNameToTenantName } from '../create-db-name';
import { forbiddenNames } from '../forbidden-tenant-names';

const dbPrefix = 'ic-';
const designDocName = '_design/default';

export class TenantService {
  public getAll(callback: Callback<ReadonlyArray<string>>) {
    nano.db.list((err, dbs) => {
      if (err) {
        callback(err, null);
      } else {
        const tenants = dbs.filter(db => db.startsWith(dbPrefix))
          .map(dbName => dbNameToTenantName(dbName));

        callback(null, tenants);
      }
    });
  }

  public details(tenant: string, callback: Callback<void>) {
    callback('error: not implemented', null);
  }

  public create(tenantName: string, callback: Callback<void>) {
    if (!this.isValidTenantName(tenantName)) {
      callback('error: invalid tenant name: ' + tenantName, null);
      return;
    }

    console.log('Creating db for tenant ' + tenantName);

    nano.db.create(createDbName(tenantName), (err, data) => {
      if(err) {
        callback(err, null);
      } else {
        this.createDesignDocs(tenantName, callback);
      }
    });
  }

  public createDesignDocs(tenantName: string, callback: Callback<void>) {
    console.log('Creating design docs for tenant ' + tenantName);

    nano.use(createDbName(tenantName)).get(designDocName, ((error, docResponse) => {
      if ((error && error.error === 'not_found') || !error) {
        const revision = (docResponse && docResponse._rev) ? docResponse._rev : undefined;

        const docToInsert = {
          _id: designDocName,
          views: {
            // View all
            "all-children": this.createViewAllDesignDoc("type/child/v1"),
            "all-crew": this.createViewAllDesignDoc("type/crew/v1"),
            "all-child-attendances": this.createViewAllDesignDoc("type/childattendance/v2"),
            "all-crew-attendances": this.createViewAllDesignDoc("type/crewattendance/v2"),
            "all-days": this.createViewAllDesignDoc("type/day/v1"),
            "all-contactperson": this.createViewAllDesignDoc("type/contactperson/v1"),
            "all-audit-log-entry": this.createViewAllDesignDoc("type/auditLogEntry/v1"),

            // Count all
            "all-children-count": this.createCountDesignDoc("type/child/v1"),
            "all-crew-count": this.createCountDesignDoc("type/crew/v1"),
            "all-child-attendances-count": this.createCountDesignDoc("type/childattendance/v2"),
            "all-crew-attendances-count": this.createCountDesignDoc("type/crewattendance/v2"),
            "all-days-count": this.createCountDesignDoc("type/day/v1"),
            "all-contactperson-count": this.createCountDesignDoc("type/contactperson/v1"),
            "all-audit-log-entry-count": this.createCountDesignDoc("type/auditLogEntry/v1")
          }
        };

        nano.use(createDbName(tenantName)).insert(Object.assign(docToInsert, { _rev: revision }), callback);

      } else {
        callback(error, null);
      }
    }));
  }

  public syncTo() {

  }

  public syncFrom() {

  }

  public isValidTenantName(name: string) {
    return /^([a-z]|[0-9]|-)*$/.test(name) && !forbiddenNames.includes(name);
  }

  private createViewAllDesignDoc(kind: string) {
    return {
      map: `function(doc) { if(doc.kind === '${kind}') { emit([doc.kind, doc._id], doc._id); } }`
    }
  }

  private createCountDesignDoc(kind: string) {
    return {
      map: `function(doc) { if(doc.kind === '${kind}') { emit('count', doc._id); } }`,
      reduce: "_count"
    }
  }

}
