import { createDbName, dbNameToTenantName } from '../create-db-name';
import { forbiddenNames } from '../forbidden-tenant-names';
import { slouch } from "../slouch";

const dbPrefix = 'ic-';
const designDocName = '_design/default';

export class TenantService {
  public async getAll(): Promise<ReadonlyArray<string>> {
    return slouch.system.listDatabases().then(dbs => {
      const tenants = dbs.filter(db => db.startsWith(dbPrefix)).map(dbName => dbNameToTenantName(dbName));
      return tenants;
    });
  }

  public details(tenant: string): Promise<void> {
    throw new Error('error: not implemented');
  }

  public async create(tenantName: string): Promise<void> {
    if (!this.isValidTenantName(tenantName)) {
      console.info(`Refusing to create tenant ${tenantName}: not valid`);
      throw new Error('error: invalid tenant name: ' + tenantName);
    }

    console.log('Creating db for tenant ' + tenantName);

    await slouch.db.create(createDbName(tenantName));
    await this.createDesignDocs(tenantName);
  }

  public async createDesignDocs(tenantName: string): Promise<void> {
    console.log('Creating design docs for tenant ' + tenantName);

    return slouch.doc.createOrUpdateIgnoreConflict(createDbName(tenantName), {
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
      },
    });
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
