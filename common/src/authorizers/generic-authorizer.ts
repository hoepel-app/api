import { Callback, Context, CustomAuthorizerEvent, Handler } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { buildIAMPolicy } from '../build-iam-policy-document';
import { IPermission } from 'types.hoepel.app/dist/src/permission';
import { IAppMetadata } from 'types.hoepel.app/dist/src/app-metadata';
import { head } from 'lodash';
import { Role } from 'types.hoepel.app/dist/src/role';

const getApiOptions = function(event: CustomAuthorizerEvent) {
    const split = event.methodArn.split(':');
    const apiGatewayArn = split[5].split('/');

    return {
        awsAccountId: split[4],
        region: split[3],
        restApiId: apiGatewayArn[0],
        stageName: apiGatewayArn[1],
    };
};

const hasPermission = (permission: IPermission, tenant: string, app_metadata: IAppMetadata): boolean => {
    if (!app_metadata || !app_metadata.tenants || !head(app_metadata.tenants.filter(t => t.name === tenant))) {
        return false;
    }

    const jwtTenant = head(app_metadata.tenants.filter(t => t.name === tenant));

    const permissionImpliedByARole: boolean = jwtTenant.roles
        .map(role => Role.parseRoleName(role).impliedPermissions.map(p => p.id).includes(permission.id))
        .includes(true);

    return jwtTenant.permissions.includes(permission.id) || permissionImpliedByARole;
};

export const createAuthorizer = (permission: IPermission) => {
    /**
     * Authorizer functions are executed before your actual functions.
     * @param {String} event.authorizationToken - JWT
     * @throws Returns 401 if the token is invalid or has expired.
     * @throws Returns 403 if the token does not have sufficient permissions.
     */
    const authorizeHandler: Handler = (event: CustomAuthorizerEvent, context: Context, callback: Callback) => {
        const pemKey = process.env.AUTH0_PEM_KEY;
        const audience = process.env.AUTH0_AUDIENCE;

        if (!pemKey) {
            throw new Error('AUTH0_PEM_KEY not set')
        }

        if (!audience) {
            throw new Error('AUTH0_AUDIENCE not set')
        }

        console.log('auth event: ', event);

        const token = (event.authorizationToken || '').replace(/Bearer /g, '');
        const apiOptions = getApiOptions(event);

        jwt.verify(token, pemKey, { audience, algorithms: [ 'RS256' ] }, (err, verified: any) => {
            if (err) {
                console.error('JWT Error', err, err.stack);
                callback(null, buildIAMPolicy('anonymous', 'Deny', event.methodArn));
            } else {
                const tenant = event.queryStringParameters['tenant'];

                if (
                    !tenant ||
                    !verified ||
                    !verified['https://inschrijven.cloud/app_metadata'] ||
                    !hasPermission(permission, tenant, verified['https://inschrijven.cloud/app_metadata'])
                ) {
                    // Insufficient permissions
                    console.log(`Insufficient permissions: need permission ${permission.id}. Have tenant ${tenant}, verified is ${verified}`);

                    callback(null, buildIAMPolicy('anonymous', 'Deny', event.methodArn));
                } else {
                    // Sufficient permissions
                    callback(null, buildIAMPolicy(verified.sub, 'Allow', event.methodArn))
                }
            }
        });
    };

    return authorizeHandler;
};
