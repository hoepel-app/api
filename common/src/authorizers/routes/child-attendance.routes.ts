
import { Routes } from '../route.types';
import { Permission } from 'types.hoepel.app/dist/src/permission';

export const routes: Routes = [
  { path: '/child-attendance/', method: 'GET', permissionNeeded: Permission.parsePermissionName('child-attendance:retrieve') }
,  { path: '/child-attendance/day/:dayId', method: 'GET', permissionNeeded: Permission.parsePermissionName('child-attendance:retrieve') }
,  { path: '/child-attendance/all', method: 'GET', permissionNeeded: Permission.parsePermissionName('child-attendance:retrieve') }
,  { path: '/child-attendance/all/byChild', method: 'GET', permissionNeeded: Permission.parsePermissionName('child-attendance:retrieve') }
,  { path: '/child-attendance/all/byDay', method: 'GET', permissionNeeded: Permission.parsePermissionName('child-attendance:retrieve') }
,  { path: '/child-attendance/all/raw', method: 'GET', permissionNeeded: Permission.parsePermissionName('child-attendance:retrieve') }
,  { path: '/child-attendance/:childId/attendances', method: 'GET', permissionNeeded: Permission.parsePermissionName('child-attendance:retrieve') }
,  { path: '/child-attendance/:childId/attendances/:dayId', method: 'POST', permissionNeeded: Permission.parsePermissionName('child-attendance:create') }
,  { path: '/child-attendance/:childId/attendances/:dayId', method: 'DELETE', permissionNeeded: Permission.parsePermissionName('child-attendance:delete') }

];