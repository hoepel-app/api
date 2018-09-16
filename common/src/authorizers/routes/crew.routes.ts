
//
// THIS FILE WAS AUTO-GENERATED - DO NOT EDIT
//

import { Routes } from '../route.types';
import { Permission } from 'types.hoepel.app/dist/src/permission';

export const routes: Routes = [
  { path: '/crew/', method: 'GET', permissionNeeded: Permission.parsePermissionName('crew:retrieve') }
,  { path: '/crew/:id', method: 'GET', permissionNeeded: Permission.parsePermissionName('crew:retrieve') }
,  { path: '/crew/', method: 'POST', permissionNeeded: Permission.parsePermissionName('crew:create') }
,  { path: '/crew/:id', method: 'PUT', permissionNeeded: Permission.parsePermissionName('crew:update') }
,  { path: '/crew/:id', method: 'DELETE', permissionNeeded: Permission.parsePermissionName('crew:delete') }

];