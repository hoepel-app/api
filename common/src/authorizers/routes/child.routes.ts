
//
// THIS FILE WAS AUTO-GENERATED - DO NOT EDIT
//

import { Routes } from '../route.types';
import { Permission } from 'types.hoepel.app/dist/src/permission';

export const routes: Routes = [
  { path: '/child/', method: 'GET', permissionNeeded: Permission.parsePermissionName('child:retrieve') }
,  { path: '/child/:id', method: 'GET', permissionNeeded: Permission.parsePermissionName('child:retrieve') }
,  { path: '/child/', method: 'POST', permissionNeeded: Permission.parsePermissionName('child:create') }
,  { path: '/child/:id', method: 'PUT', permissionNeeded: Permission.parsePermissionName('child:update') }
,  { path: '/child/:id', method: 'DELETE', permissionNeeded: Permission.parsePermissionName('child:delete') }

];