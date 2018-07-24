import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { ResponseBuilder } from '../response-builder';
import * as auth0 from 'auth0';
import { tryParseJson } from '../try-parse-json';
import { every, toPairs, isString } from 'lodash';
import { Permission } from 'types.hoepel.app/dist/src/permission';
import { Role } from 'types.hoepel.app/dist/src/role';
import { createAuthorizer } from '../authorizers/generic-authorizer';

// Helpers
const responseBuilder = new ResponseBuilder();

const auth0Audience = process.env.AUTH0_AUDIENCE;

const management = new auth0.ManagementClient({
  domain: process.env.AUTH0_DOMAIN || 'No domain given',
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

// API
export const getAllUsers: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {

  management.getUsers((err, users) => {
    if (err) {
      if (err.name && err.name.toLowerCase() === 'not found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        console.error('unexpected error', err);
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.found(users));
    }
  });
};

export const getUserById: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  const userId = event.pathParameters['userId'];

  management.getUser({ id: userId }, (err, user) => {
    if (err) {
      if (err.name && err.name.toLowerCase() === 'not found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        console.error('unexpected error', err);
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.found(user));
    }
  });
};

export const getTenantData: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  const userId = event.pathParameters['userId'];
  const tenant = event.pathParameters['tenant'];


  management.getUser({ id: userId }, (err, user) => {
    if (err) {
      if (err.name && err.name.toLowerCase() === 'not found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        console.error('unexpected error', err);
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      if (user.app_metadata && user.app_metadata.tenants && user.app_metadata.tenants.find(el => el.name === tenant)) {
        cb(null, responseBuilder.found(user.app_metadata.tenants.find(el => el.name === tenant)));
      } else {
        cb(null, responseBuilder.notFoundResponse());
      }
    }
  });
};

export const putTenantData: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  const userId = event.pathParameters['userId'];
  const tenant = event.pathParameters['tenant'];

  management.getUser({ id: userId }, (err, user) => {
    if (err) {
      if (err.name && err.name.toLowerCase() === 'not found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        console.error('unexpected error', err);
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      // Parse body (roles and permissions)
      const jsonBody = tryParseJson(event.body);

      if(!jsonBody ||
        !jsonBody.roles ||
        !jsonBody.permissions ||
        !Array.isArray(jsonBody.permissions) ||
        !Array.isArray(jsonBody.roles) ||
        !every(jsonBody.permissions, isString) ||
        !every(jsonBody.roles, isString))
      {
        cb(null, new ResponseBuilder().bodyMissingOrNotValidJson());
        return;
      }

      // Update metadata

      const newTenantMetadata = { name: tenant, roles: jsonBody.roles, permissions: jsonBody.permissions };

      const tenantsMetadata = (user.app_metadata && user.app_metadata.tenants) ? user.app_metadata.tenants : [];
      const newtenantsMetadata = [ ...tenantsMetadata.filter(metadata => metadata.name !== tenant), newTenantMetadata ];
      const newMetadata = Object.assign((user.app_metadata || {}), { tenants: newtenantsMetadata });

      // Make the call to auth0
      management.updateAppMetadata({ id: userId }, newMetadata, (err, data) => {
        if (err) {
          console.error('unexpected error', err);
          cb(null, responseBuilder.unexpectedError(err));
        } else {
          cb(null, responseBuilder.updated(userId));
        }
      });
    }
  });
};

// TODO putTenantDataAnyTenant

export const getAllPermissions: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  cb(null, responseBuilder.found(Permission.allByCategory));
};

export const getAllRoles: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  cb(null, responseBuilder.found(
      toPairs(Role.all).map(([key, value]) => { return { level: key, roles: value } } )
  ));
};

export const getAllUsersAuthorizer = createAuthorizer(Permission.userRetrieve);
export const getUserByIdAuthorizer = createAuthorizer(Permission.userRetrieve);
export const getTenantDataAuthorizer = createAuthorizer(Permission.userRetrieve);
export const putTenantDataAuthorizer = createAuthorizer(Permission.userPutTenantData);
