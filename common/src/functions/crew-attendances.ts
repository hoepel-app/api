import { APIGatewayEvent, Handler } from 'aws-lambda';
import { CrewAttendanceService } from '../services/crew-attendance-service';
import { ResponseBuilder } from '../response-builder';
import { isString } from 'lodash';
import { tryParseJson } from '../try-parse-json';
import { createDbName } from '../create-db-name';

// Helpers

const crewAttendanceService = new CrewAttendanceService();
const responseBuilder = new ResponseBuilder();

// API

export const numberOfCrewAttendances: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  try {
    const att = await crewAttendanceService.findNumberOfCrewAttendances({
      dbName: createDbName(tenant),
    });
    return responseBuilder.found(att);
  } catch (e) {
    if (e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};

export const crewAttendancesOnDay: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  const dayId = event.pathParameters['dayId'];

  try {
    const att = await crewAttendanceService.findAllOnDay({
      dbName: createDbName(tenant), dayId
    });
    return responseBuilder.found(att);
  } catch (e) {
    if (e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};

export const findAllPerCrew: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  try {
    const att = await crewAttendanceService.findAll({
      dbName: createDbName(tenant),
    });
    return responseBuilder.found(att);
  } catch (e) {
    if (e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};

export const findAllPerDay: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  try {
    const att = await crewAttendanceService.findAllPerDay({
      dbName: createDbName(tenant),
    });
    return responseBuilder.found(att);
  } catch (e) {
    if (e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};

export const findAllRaw: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  try {
    const att = await crewAttendanceService.findAllRaw({
      dbName: createDbName(tenant),
    });
    return responseBuilder.found(att);
  } catch (e) {
    if (e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};

export const getAttendancesForCrew: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  const id = event.pathParameters['crewId'];

  try {
    const att = await crewAttendanceService.findAttendancesForCrew({
      dbName: createDbName(tenant), crewId: id
    });
    return responseBuilder.found(att);
  } catch (e) {
    if (e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};

export const addAttendancesForCrew: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  const dayId = event.pathParameters['dayId'];
  const crewId = event.pathParameters['crewId'];

  if (!event.body
    || !tryParseJson(event.body)
    || !(tryParseJson(event.body).shiftIds)
    || !Array.isArray((tryParseJson(event.body).shiftIds))
    || tryParseJson(event.body).shiftIds.filter(element => !isString(element)).length > 0
  ) {
    return responseBuilder.unexpectedError('Invalid body: must be JSON object containing key "shiftIds", an array of shift ids');
  }

  const shiftIds = tryParseJson(event.body).shiftIds;

  try {
    const result = await crewAttendanceService.addAttendancesForCrew({
      dbName: createDbName(tenant),
      shifts: shiftIds,
      crewId,
      dayId,
    });
    return responseBuilder.created(result);
  } catch (e) {
    if (e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};

export const deleteAttendancesForCrew: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  const dayId = event.pathParameters['dayId'];
  const crewId = event.pathParameters['crewId'];

  if (!event.body
    || !tryParseJson(event.body)
    || !(tryParseJson(event.body).shiftIds)
    || !Array.isArray((tryParseJson(event.body).shiftIds))
    || tryParseJson(event.body).shiftIds.filter(element => !isString(element)).length > 0
  ) {
    return responseBuilder.unexpectedError('Invalid body: must be JSON object containing key "shiftIds", an array of shift ids');
  }

  const shiftIds = tryParseJson(event.body).shiftIds;

  try {
    const att = await crewAttendanceService.removeAttendancesForCrew({
      dbName: createDbName(tenant),
      crewId,
      dayId,
      shifts: shiftIds,
    });
    return responseBuilder.deleted(att);
  } catch (e) {
    if (e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};
