
//
// THIS FILE WAS AUTO-GENERATED - DO NOT EDIT
//

import { Routes } from '../route.types';
import { Permission } from 'types.hoepel.app/dist/src/permission';

export const routes: Routes = [
  { path: '/files/export/children', method: 'GET', permissionNeeded: Permission.parsePermissionName('export:children') }
,  { path: '/files/export/children/with-remarks', method: 'GET', permissionNeeded: Permission.parsePermissionName('export:children') }

];