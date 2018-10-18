
//
// THIS FILE WAS AUTO-GENERATED - DO NOT EDIT
//

import { Routes } from '../route.types';
import { Permission } from 'types.hoepel.app/dist/src/permission';

export const routes: Routes = [
  { path: '/auth/user', method: 'GET', permissionNeeded: Permission.parsePermissionName('user:list') }
,  { path: '/auth/user/:userId', method: 'GET', permissionNeeded: Permission.parsePermissionName('user:list') }
,  { path: '/auth/user/:userId/:tenant', method: 'GET', permissionNeeded: Permission.parsePermissionName('user:list') }
,  { path: '/auth/user/:userId/:tenant', method: 'PUT', permissionNeeded: Permission.parsePermissionName('users:put-data') }

];