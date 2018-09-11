import { APIGatewayEvent, Handler } from 'aws-lambda';
import { ResponseBuilder } from '../response-builder';
import { AgeGroupsService } from '../services/age-groups-service';
import { tryParseJson } from '../try-parse-json';
import { createDbName } from '../create-db-name';

const responseBuilder = new ResponseBuilder();
const ageGroupsService = new AgeGroupsService();

export const getAll: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  try {
    const groups = await ageGroupsService.getAll(createDbName(tenant));
    return responseBuilder.found(groups);
  } catch (e) {
    // TODO not sure about what errors this returns - should map them to responseBuilder.notFound, etc.
    return responseBuilder.unexpectedError(e);
  }
};

export const createOrUpdate: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  if (!event.body
    || !tryParseJson(event.body)
    || !(tryParseJson(event.body).groups)
    || !Array.isArray((tryParseJson(event.body).groups))
    || tryParseJson(event.body).groups.filter(element => !element.name || !element.bornOnOrAfter || !element.bornOnOrBefore).length > 0
  ) {
    return responseBuilder.unexpectedError('Invalid body: must be JSON object containing key "groups", an array age groups');
  }

  const ageGroups = tryParseJson(event.body).groups;

  const groups = await ageGroupsService.createOrUpdate(createDbName(tenant), ageGroups);
  return responseBuilder.found(groups);
};