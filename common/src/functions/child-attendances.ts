import { APIGatewayEvent, Handler } from 'aws-lambda';
import { ChildAttendanceService } from '../services/child-attendance-service';
import { ResponseBuilder } from '../response-builder';
import { tryParseJson } from '../try-parse-json';
import { createDbName } from '../create-db-name';
import { isString } from 'lodash';

// Helpers
const childAttendanceService = new ChildAttendanceService();
const responseBuilder = new ResponseBuilder();

// API

export const numberOfChildAttendances: Handler = async (event: APIGatewayEvent) => {

  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  try {
      const att = await childAttendanceService.findNumberOfChildAttendances({
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

export const childAttendancesOnDay: Handler = async (event: APIGatewayEvent) => {

  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
      return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  const dayId = event.pathParameters['dayId'];

  try {
    const all = await childAttendanceService.findAllOnDay({ dbName: createDbName(tenant), dayId });
    return responseBuilder.found(all);
  } catch (e) {
    if (e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};

export const findAllPerChild: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  try {
      const all = await childAttendanceService.findAll({ dbName: createDbName(tenant) });
      return responseBuilder.found(all);
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
    const all = await childAttendanceService.findAllPerDay({ dbName: createDbName(tenant) });
    return responseBuilder.found(all);
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
    const all = await childAttendanceService.findAllRaw({ dbName: createDbName(tenant) });
    return responseBuilder.found(all);
  } catch (e) {
    if (e.error == 'not_found') {
        return responseBuilder.notFoundResponse();
    } else {
        return responseBuilder.unexpectedError(e);
    }
  }
};

export const getAttendancesForChild: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  const id = event.pathParameters['childId'];

  try {
    const attendancesForChild = await childAttendanceService.findAttendancesForChild({ dbName: createDbName(tenant), childId: id });
    return responseBuilder.found(attendancesForChild);
  } catch (e) {
    if (e.error && e.error == 'not_found') {
      responseBuilder.notFoundResponse();
    } else {
      responseBuilder.unexpectedError(e);
    }
  }
};

export const addAttendancesForChild: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  const dayId = event.pathParameters['dayId'];
  const childId = event.pathParameters['childId'];

  if (!event.body
    || !tryParseJson(event.body)
    || !(tryParseJson(event.body).shiftIds)
    || !Array.isArray((tryParseJson(event.body).shiftIds))
    || tryParseJson(event.body).shiftIds.filter(element => !isString(element)).length > 0
  ) {
    return responseBuilder.unexpectedError('Invalid body: must be JSON object containing key "shiftIds", an array of shift ids');
  }

  const shiftIds = tryParseJson(event.body).shiftIds;
  const ageGroupName = tryParseJson(event.body).ageGroupName;

  try {
    const res = await childAttendanceService.addAttendancesForChild({
        dbName: createDbName(tenant),
        ageGroupName,
        shifts: shiftIds,
        childId,
        dayId,
    });

    return responseBuilder.created(res);
  } catch (e) {
    if (e.error && e.error == 'not_found') {
      responseBuilder.notFoundResponse();
    } else {
      responseBuilder.unexpectedError(e);
    }
  }
};

export const deleteAttendancesForChild: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  const dayId = event.pathParameters['dayId'];
  const childId = event.pathParameters['childId'];

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
    const res = await childAttendanceService.removeAttendancesForChild({ dbName: createDbName(tenant), childId, dayId, shifts: shiftIds });

    return responseBuilder.deleted(res);
  } catch (e) {
    if (e.error && e.error == 'not_found') {
      responseBuilder.notFoundResponse();
    } else {
      responseBuilder.unexpectedError(e);
    }
  }
};
