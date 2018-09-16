
//
// THIS FILE WAS AUTO-GENERATED - DO NOT EDIT
//

import { Routes } from '../route.types';
import { Permission } from 'types.hoepel.app/dist/src/permission';

export const routes: Routes = [
  { path: '/crew-attendance/', method: 'GET', permissionNeeded: Permission.parsePermissionName('crew-attendance:retrieve') }
,  { path: '/crew-attendance/day/:dayId', method: 'GET', permissionNeeded: Permission.parsePermissionName('crew-attendance:retrieve') }
,  { path: '/crew-attendance/all', method: 'GET', permissionNeeded: Permission.parsePermissionName('crew-attendance:retrieve') }
,  { path: '/crew-attendanceday/attendances/crew/all/byCrew', method: 'GET', permissionNeeded: Permission.parsePermissionName('crew-attendance:retrieve') }
,  { path: '/crew-attendance/all/byDay', method: 'GET', permissionNeeded: Permission.parsePermissionName('crew-attendance:retrieve') }
,  { path: '/crew-attendance/all/raw', method: 'GET', permissionNeeded: Permission.parsePermissionName('crew-attendance:retrieve') }
,  { path: '/crew-attendance/:crewId/attendances', method: 'GET', permissionNeeded: Permission.parsePermissionName('crew-attendance:retrieve') }
,  { path: '/crew-attendance/:crewId/attendances/:dayId', method: 'POST', permissionNeeded: Permission.parsePermissionName('crew-attendance:create') }
,  { path: '/crew-attendance/:crewId/attendances/:dayId', method: 'DELETE', permissionNeeded: Permission.parsePermissionName('crew-attendance:delete') }

];