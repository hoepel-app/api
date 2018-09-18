import { IPermission } from 'types.hoepel.app/dist/src/permission';
import * as RouteParser from 'route-parser';
import { Method, Route } from './route.types';
import { find, isUndefined, last, dropRight, flatMap } from 'lodash';
import { hasPermission } from './has-permission';
import { IRole } from 'types.hoepel.app/dist/src/role';
import { allRoutes } from './all-routes';

export const checkPermission = (url: string, method: Method, ownedPermissions: ReadonlyArray<IPermission>, ownedRoles: ReadonlyArray<IRole>, userJwt: any): boolean => {
    let errors: string[] = [];

    const mayAccessResource = find(allRoutes, (route: Route): boolean => {
        // drop trailing '/' if there is one
        const path = last(route.path) === '/' ? route.path.slice(0, -1) : route.path;
        const urlWithoutTrailingSlash = last(url) === '/' ? url.slice(0, -1) : url;

        const routeParser = new RouteParser(path);

        if (!routeParser.match(urlWithoutTrailingSlash) || method !== route.method) {
            // route or method doesn't match
            return false;
        }

        if (hasPermission(route.permissionNeeded, ownedPermissions, ownedRoles)) {
            return true;
        } else {
            errors.push(
                `User has insufficient permissions to access route.
                > Tried ${method} ${url}
                > Needs permission '${route.permissionNeeded.id}'
                > Has permissions: ${ownedPermissions.map(p => p.id)}
                > Has roles: ${ownedRoles.map(role => role.id)}
                > Has implied permissions: ${flatMap(ownedRoles.map(role => role.impliedPermissions.map(permission => permission.id)))}
                > JWT: ${userJwt}`,
            );
            return false;
        }
    });

    if (!mayAccessResource) {
      console.log('User may not access resource: route does not match known routes, or no permission to access route.');
      console.log('Known routes: ', allRoutes);
      errors.map(error => console.log(error));
    }

    return !isUndefined(mayAccessResource);
};
