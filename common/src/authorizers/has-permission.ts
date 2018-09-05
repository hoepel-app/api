import { IPermission } from 'types.hoepel.app/dist/src/permission';
import { IRole } from 'types.hoepel.app/dist/src/role';
import { flatMap } from 'lodash';

export const hasPermission = (permission: IPermission, ownedPermissions: ReadonlyArray<IPermission>, ownedRoles: ReadonlyArray<IRole>): boolean => {

    // Do we have a role that implies this permission?
    const permissionImpliedByARole: boolean = flatMap(ownedRoles, role => role.impliedPermissions as IPermission[])
        .map(permission => permission.id).includes(permission.id);

    return ownedPermissions.map(p => p.id).includes(permission.id) || permissionImpliedByARole;
};
