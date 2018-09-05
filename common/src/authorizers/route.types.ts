import { IPermission } from 'types.hoepel.app/dist/src/permission';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type Route = { path: string, method: Method, permissionNeeded: IPermission};
export type Routes = ReadonlyArray<Route>;
