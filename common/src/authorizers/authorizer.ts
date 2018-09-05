import { Callback, Context, CustomAuthorizerEvent } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { buildIAMPolicy } from '../build-iam-policy-document';
import { checkPermission } from './routes-matcher';
import { Permission } from 'types.hoepel.app/dist/src/permission';
import { Role } from 'types.hoepel.app/dist/src/role';
import { Method } from './route.types';
import { get } from 'lodash';

type EventType = {
    type: string, // e.g. 'REQUEST'
    path: string, // e.g. '/'
    httpMethod: string, // e.g. 'GET'
    headers: { [key: string]: string }, // e.g. { accept: '*/*', Host: 'localhost:3000' }
    pathParameters: any,
    queryStringParameters: { [key: string]: string },
    methodArn: string,
}


export const authorizer = (event: EventType, context: Context, callback: Callback) => {

    const pemKey = process.env.AUTH0_PEM_KEY;
    const audience = process.env.AUTH0_AUDIENCE;

    if (!pemKey) {
        throw new Error('AUTH0_PEM_KEY not set')
    }

    if (!audience) {
        throw new Error('AUTH0_AUDIENCE not set')
    }

    if (!event || !event.headers || !event.headers['Authorization']) {
        throw new Error('Could not find Authorization header. Did you set up the authorizer to use request integration?');
    }

    const token = (event.headers['Authorization'] || '').replace(/Bearer /g, '');

    jwt.verify(token, pemKey, { audience, algorithms: [ 'RS256' ] }, (err, verified: any) => {
        if (err) {
            console.error('JWT Error', err, err.stack);
            callback(null, buildIAMPolicy('anonymous', 'Deny', event.methodArn));
        } else {
            const tenant = event.queryStringParameters['tenant'];

            if (!tenant) {
                console.log('Tenant not set in query string');
                callback(null, buildIAMPolicy('anonymous', 'Deny', event.methodArn))
            }

            if (!verified) {
                console.log('Invalid JWT');
                callback(null, buildIAMPolicy('anonymous', 'Deny', event.methodArn))
            }

            if (!verified['https://inschrijven.cloud/app_metadata']) {
                console.log('JWT does not could app metadata key');
                callback(null, buildIAMPolicy('anonymous', 'Deny', event.methodArn));
            }

            const metadata = verified['https://inschrijven.cloud/app_metadata'];
            const permissions = (get(metadata['tenants'].filter(t => t.name === tenant), '[0].permissions') || []).map(permission => Permission.parsePermissionName(permission));
            const roles = (get(metadata['tenants'].filter(t => t.name === tenant), '[0].roles') || []).map(role => Role.parseRoleName(role));

            const allowed = checkPermission(event.path, event.httpMethod.toLocaleUpperCase() as Method, permissions, roles, token);

            if (allowed) {
                callback(null, buildIAMPolicy(verified.sub, 'Allow', event.methodArn));
            } else {
                console.log('Auth event: ', event);
                callback(null, buildIAMPolicy('anonymous', 'Deny', event.methodArn));
            }
        }
    });
};
