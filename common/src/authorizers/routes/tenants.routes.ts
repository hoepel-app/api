
import { Routes } from '../route.types';
import { Permission } from 'types.hoepel.app/dist/src/permission';

export const routes: Routes = [
  { path: '/tenants/', method: 'GET', permissionNeeded: Permission.parsePermissionName('superuser:list-tenants') }
,  { path: '/tenants/:name', method: 'GET', permissionNeeded: Permission.parsePermissionName('superuser:list-tenants') }
,  { path: '/tenants/:name', method: 'PUT', permissionNeeded: Permission.parsePermissionName('superuser:create-tenant') }
,  { path: '/tenants/:name/generate-design-docs', method: 'POST', permissionNeeded: Permission.parsePermissionName('superuser:init-dbs') }
,  { path: '/tenants/sync-to/:name', method: 'POST', permissionNeeded: Permission.parsePermissionName('superuser:sync-db') }
,  { path: '/tenants/sync-from/:name', method: 'POST', permissionNeeded: Permission.parsePermissionName('superuser:sync-db') }

];