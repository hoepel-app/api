import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { ResponseBuilder } from '../response-builder';
import { AgeGroupsService } from '../services/age-groups-service';
import { tryParseJson } from '../try-parse-json';
import { createDbName } from '../create-db-name';
import { createAuthorizer } from '../authorizers/generic-authorizer';
import { Permission } from 'types.hoepel.app/dist/src/permission';

const responseBuilder = new ResponseBuilder();
const ageGroupsService = new AgeGroupsService();

export const getAll: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  ageGroupsService.getAll(createDbName(tenant), (err, data) => {
    if (err) {
      if (err.error && err.error === 'not_found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        console.error('unexpected error', err);
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.found(data));
    }
  });
};

export const createOrUpdate: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  if (!event.body
    || !tryParseJson(event.body)
    || !(tryParseJson(event.body).groups)
    || !Array.isArray((tryParseJson(event.body).groups))
    || tryParseJson(event.body).groups.filter(element => !element.name || !element.bornOnOrAfter || !element.bornOnOrBefore).length > 0
  ) {
    cb(null, responseBuilder.unexpectedError('Invalid body: must be JSON object containing key "groups", an array age groups'));
    return;
  }

  const ageGroups = tryParseJson(event.body).groups;

  ageGroupsService.createOrUpdate(createDbName(tenant), ageGroups, (err, data) => {
    if (err) {
      if (err.error && err.error === 'not_found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        console.error('unexpected error', err);
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.found(data));
    }
  });
};

export const getAllAuthorizer = createAuthorizer(Permission.ageGroupsRead);
export const createOrUpdateAuthorizer = createAuthorizer(Permission.ageGroupsCreateAndUpdate);
