import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { ChildAttendanceService } from './services/child-attendance-service';
import { ResponseBuilder } from './common/response-builder';

const childAttendanceService = new ChildAttendanceService();
const responseBuilder = new ResponseBuilder();

export const numberOfChildAttendances: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {

  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  childAttendanceService.findNumberOfChildAttendances({
    dbName: tenant,
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

  const id = event.pathParameters['childId'];


};

export const findAllPerChild: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

};

export const findAllPerDay: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

};

export const findAllRaw: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

};

export const getAttendancesForChild: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  const id = event.pathParameters['childId'];
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
};
