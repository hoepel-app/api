import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { ResponseBuilder } from './common/response-builder';
import * as auth0 from 'auth0';
import { tryParseJson } from './common/try-parse-json';
import { isArray, isString } from 'util';
import { every } from 'lodash';

// Helpers
const responseBuilder = new ResponseBuilder();

const auth0Audience = 'https://inschrijven-cloud.eu.auth0.com/api/v2/';

const management = new auth0.ManagementClient({
  domain: 'inschrijven-cloud.eu.auth0.com',
  clientId: 'QLfuo1XV6A9T1LSZRIenkvVa2cVj2n7Y',
  clientSecret: '8DXEKp7vhL8iG6bQ6FzWL80m8LEqc-HSKqwtbUVDXexixLuehj6-z1L2OTqK2-M4',
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
  const userId = event.pathParameters['id'];

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
        !isArray(jsonBody.permissions) ||
        !isArray(jsonBody.roles) ||
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

export const getAllPermissions: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  cb(null, responseBuilder.notImplemented());
};

export const getAllRoles: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  cb(null, responseBuilder.notImplemented());
}

