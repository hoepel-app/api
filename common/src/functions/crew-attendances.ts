import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { CrewAttendanceService } from '../services/crew-attendance-service';
import { ResponseBuilder } from '../response-builder';
import { isString } from 'util';
import { tryParseJson } from '../try-parse-json';
import { createDbName } from '../create-db-name';

// Helpers

const crewAttendanceService = new CrewAttendanceService();
const responseBuilder = new ResponseBuilder();

// API

export const numberOfCrewAttendances: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {

  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  crewAttendanceService.findNumberOfCrewAttendances({
    dbName: createDbName(tenant),
  }, (err, data) => {
    if (err) {
      if (err.error && err.error === 'not_found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.found(data));
    }
  });

};

export const crewAttendancesOnDay: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  const dayId = event.pathParameters['dayId'];

  crewAttendanceService.findAllOnDay({ dbName: createDbName(tenant), dayId }, (err, data) => {
    if (err) {
      if (err.error && err.error === 'not_found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.found(data));
    }
  });
};

export const findAllPerCrew: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  crewAttendanceService.findAll({ dbName: createDbName(tenant) }, (err, data) => {
    if (err) {
      if (err.error && err.error === 'not_found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.found(data));
    }
  });
};

export const findAllPerDay: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  crewAttendanceService.findAllPerDay({ dbName: createDbName(tenant) }, (err, data) => {
    if (err) {
      if (err.error && err.error === 'not_found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.found(data));
    }
  });
};

export const findAllRaw: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  crewAttendanceService.findAllRaw({
    dbName: createDbName(tenant),
  }, (err, data) => {
    if (err) {
      if (err.error && err.error === 'not_found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.found(data));
    }
  })
};

export const getAttendancesForCrew: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  const id = event.pathParameters['crewId'];

  crewAttendanceService.findAttendancesForCrew({
    dbName: createDbName(tenant),
    crewId: id,
  }, (err, data) => {
    if (err) {
      if (err.error && err.error === 'not_found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.found(data));
    }
  });
};

export const addAttendancesForCrew: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
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
    cb(null, responseBuilder.unexpectedError('Invalid body: must be JSON object containing key "shiftIds", an array of shift ids'));
    return;
  }

  const shiftIds = tryParseJson(event.body).shiftIds;

  crewAttendanceService.addAttendancesForCrew({
    dbName: createDbName(tenant),
    shifts: shiftIds,
    crewId,
    dayId,
  }, (err, data) => {
    if (err) {
      if (err.error && err.error === 'not_found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.created(data));
    }
  });
};

export const deleteAttendancesForCrew: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
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
    cb(null, responseBuilder.unexpectedError('Invalid body: must be JSON object containing key "shiftIds", an array of shift ids'));
    return;
  }

  const shiftIds = tryParseJson(event.body).shiftIds

  crewAttendanceService.removeAttendancesForCrew({ dbName: createDbName(tenant), crewId, dayId, shifts: shiftIds }, (err, data) => {
    if (err) {
      if (err.error && err.error === 'not_found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.deleted(data));
    }
  });
};
