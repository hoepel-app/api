
import { Routes } from '../route.types';
import { Permission } from 'types.hoepel.app/dist/src/permission';

export const routes: Routes = [
  { path: '/age-groups/', method: 'GET', permissionNeeded: Permission.parsePermissionName('age-groups:retrieve') }
,  { path: '/age-groups/', method: 'PUT', permissionNeeded: Permission.parsePermissionName('age-groups:update') }

];