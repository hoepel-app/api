import { APIGatewayEvent, Handler } from 'aws-lambda';
import { ResponseBuilder } from '../response-builder';
import { ManagementClient } from 'auth0';
import { tryParseJson } from '../try-parse-json';
import { every, toPairs, isString } from 'lodash';
import { Permission } from 'types.hoepel.app/dist/src/permission';
import { Role } from 'types.hoepel.app/dist/src/role';

// Helpers
const responseBuilder = new ResponseBuilder();

const auth0Audience = process.env.AUTH0_AUDIENCE;

const management = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN || 'No domain given',
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

// API
export const getAllUsers: Handler = async (event: APIGatewayEvent) => {
  return management.getUsers()
    .then(users => responseBuilder.found(users))
    .catch(err => {
      if (err.name && err.name.toLowerCase() === 'not found') {
        return responseBuilder.notFoundResponse();
      } else {
        console.error('unexpected error', err);
        return responseBuilder.unexpectedError(err);
      }
    });
};

export const getUserById: Handler = async (event: APIGatewayEvent) => {
  const userId = event.pathParameters['userId'];

  return management.getUser({ id: userId })
    .then(user => responseBuilder.found(user))
    .catch(err => {
      if (err.name && err.name.toLowerCase() === 'not found') {
        return responseBuilder.notFoundResponse();
      } else {
        console.error('unexpected error', err);
        return responseBuilder.unexpectedError(err);
      }
    });
};

export const getTenantData: Handler = async (event: APIGatewayEvent) => {
  const userId = event.pathParameters['userId'];
  const tenant = event.pathParameters['tenant'];


  return management.getUser({ id: userId })
    .then(user => {
      if (user.app_metadata && user.app_metadata.tenants && user.app_metadata.tenants.find(el => el.name === tenant)) {
        return responseBuilder.found(user.app_metadata.tenants.find(el => el.name === tenant));
      } else {
        return responseBuilder.notFoundResponse();
      }
    })
    .catch(err => {
      if (err.name && err.name.toLowerCase() === 'not found') {
        return responseBuilder.notFoundResponse();
      } else {
        console.error('unexpected error', err);
        return responseBuilder.unexpectedError(err);
      }
    });
};

export const putTenantData: Handler = async (event: APIGatewayEvent) => {
  const userId = event.pathParameters['userId'];
  const tenant = event.pathParameters['tenant'];

  try {
    const user = await management.getUser({id: userId});

    // Parse body (roles and permissions)
    const jsonBody = tryParseJson(event.body);

    if (!jsonBody ||
      !jsonBody.roles ||
      !jsonBody.permissions ||
      !Array.isArray(jsonBody.permissions) ||
      !Array.isArray(jsonBody.roles) ||
      !every(jsonBody.permissions, isString) ||
      !every(jsonBody.roles, isString)) {
      return responseBuilder.bodyMissingOrNotValidJson();
    }

    // Update metadata

    const newTenantMetadata = {name: tenant, roles: jsonBody.roles, permissions: jsonBody.permissions};

    const tenantsMetadata = (user.app_metadata && user.app_metadata.tenants) ? user.app_metadata.tenants : [];
    const newtenantsMetadata = [...tenantsMetadata.filter(metadata => metadata.name !== tenant), newTenantMetadata];
    const newMetadata = Object.assign((user.app_metadata || {}), {tenants: newtenantsMetadata});

    // Make the call to auth0
    return management.updateAppMetadata({id: userId}, newMetadata)
      .then(data => responseBuilder.updated(userId))
      .catch(err => {
        console.error('unexpected error', err);
        return responseBuilder.unexpectedError(err);
      });
  } catch (err) {
    if (err.name && err.name.toLowerCase() === 'not found') {
      return responseBuilder.notFoundResponse();
    } else {
      console.error('unexpected error', err);
      return responseBuilder.unexpectedError(err);
    }
  }
};

// TODO putTenantDataAnyTenant

export const getAllPermissions: Handler = async (event: APIGatewayEvent) => {
  return responseBuilder.found(Permission.allByCategory);
};

export const getAllRoles: Handler = async (event: APIGatewayEvent) => {
  return responseBuilder.found(
      toPairs(Role.all).map(([key, value]) => { return { level: key, roles: value } } )
  );
};
