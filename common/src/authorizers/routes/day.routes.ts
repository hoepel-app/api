
//
// THIS FILE WAS AUTO-GENERATED - DO NOT EDIT
//

import { Routes } from '../route.types';
import { Permission } from 'types.hoepel.app/dist/src/permission';

export const routes: Routes = [
  { path: '/day/', method: 'GET', permissionNeeded: Permission.parsePermissionName('day:retrieve') }
,  { path: '/day/:id', method: 'GET', permissionNeeded: Permission.parsePermissionName('day:retrieve') }
,  { path: '/day/', method: 'POST', permissionNeeded: Permission.parsePermissionName('day:create') }
,  { path: '/day/:id', method: 'PUT', permissionNeeded: Permission.parsePermissionName('day:update') }
,  { path: '/day/:id', method: 'DELETE', permissionNeeded: Permission.parsePermissionName('day:delete') }

];