
import { Routes } from '../route.types';
import { Permission } from 'types.hoepel.app/dist/src/permission';

export const routes: Routes = [
  { path: '/contact-person/', method: 'GET', permissionNeeded: Permission.parsePermissionName('contactperson:retrieve') }
,  { path: '/contact-person/:id', method: 'GET', permissionNeeded: Permission.parsePermissionName('contactperson:retrieve') }
,  { path: '/contact-person/', method: 'POST', permissionNeeded: Permission.parsePermissionName('contactperson:create') }
,  { path: '/contact-person/:id', method: 'PUT', permissionNeeded: Permission.parsePermissionName('contactperson:update') }
,  { path: '/contact-person/:id', method: 'DELETE', permissionNeeded: Permission.parsePermissionName('contactperson:delete') }

];