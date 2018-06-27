export const dbPrefix = 'ic-';
export const createDbName = (tenantName: string) => dbPrefix + tenantName;
export const dbNameToTenantName = (dbName: string) => dbName.slice(dbPrefix.length)
