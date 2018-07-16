import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { ChildAttendanceService } from '../services/child-attendance-service';
import { ResponseBuilder } from '../response-builder';
import { isString } from 'util';
import { tryParseJson } from '../try-parse-json';
import { createDbName } from '../create-db-name';

// Helpers
const childAttendanceService = new ChildAttendanceService();
const responseBuilder = new ResponseBuilder();

// API

export const numberOfChildAttendances: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {

  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  childAttendanceService.findNumberOfChildAttendances({
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

export const childAttendancesOnDay: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  const dayId = event.pathParameters['dayId'];

  childAttendanceService.findAllOnDay({ dbName: createDbName(tenant), dayId }, (err, data) => {
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

export const findAllPerChild: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  childAttendanceService.findAll({ dbName: createDbName(tenant) }, (err, data) => {
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

  childAttendanceService.findAllPerDay({ dbName: createDbName(tenant) }, (err, data) => {
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

  childAttendanceService.findAllRaw({
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

export const getAttendancesForChild: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  const id = event.pathParameters['childId'];

  childAttendanceService.findAttendancesForChild({
    dbName: createDbName(tenant),
    childId: id,
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

export const addAttendancesForChild: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
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
    cb(null, responseBuilder.unexpectedError('Invalid body: must be JSON object containing key "shiftIds", an array of shift ids'));
    return;
  }

  const shiftIds = tryParseJson(event.body).shiftIds;
  const ageGroupName = tryParseJson(event.body).ageGroupName;

  childAttendanceService.addAttendancesForChild({
    dbName: createDbName(tenant),
    ageGroupName,
    shifts: shiftIds,
    childId,
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

export const deleteAttendancesForChild: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
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
    cb(null, responseBuilder.unexpectedError('Invalid body: must be JSON object containing key "shiftIds", an array of shift ids'));
    return;
  }

  const shiftIds = tryParseJson(event.body).shiftIds

  childAttendanceService.removeAttendancesForChild({ dbName: createDbName(tenant), childId, dayId, shifts: shiftIds }, (err, data) => {
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
