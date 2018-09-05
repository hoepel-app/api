
import { Routes } from '../route.types';
import { Permission } from 'types.hoepel.app/dist/src/permission';

export const routes: Routes = [
  { path: '/authuser', method: 'GET', permissionNeeded: Permission.parsePermissionName('user:list') }
,  { path: '/authuser/:userId', method: 'GET', permissionNeeded: Permission.parsePermissionName('user:list') }
,  { path: '/authuser/:userId/:tenant', method: 'GET', permissionNeeded: Permission.parsePermissionName('user:list') }
,  { path: '/authuser/:userId/:tenant', method: 'PUT', permissionNeeded: Permission.parsePermissionName('users:put-data') }

];