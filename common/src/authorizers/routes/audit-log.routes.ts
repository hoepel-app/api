
//
// THIS FILE WAS AUTO-GENERATED - DO NOT EDIT
//

import { Routes } from '../route.types';
import { Permission } from 'types.hoepel.app/dist/src/permission';

export const routes: Routes = [
  { path: '/audit-log/', method: 'GET', permissionNeeded: Permission.parsePermissionName('audit-log:read') }

];