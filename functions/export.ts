import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { ResponseBuilder } from './common/response-builder';
import { ExportService } from './services/export-service';
import { childRepository } from './children';

// Helpers

const responseBuilder = new ResponseBuilder();
const createDbName = (tenantName: string) => 'ic-' + tenantName;
const exportService = new ExportService(childRepository);

// API

export const downloadChildren: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {

  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  exportService.downloadChildren(createDbName(tenant), (err, data) => {
    if (err) {
      if (err.error && err.error === 'not_found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.foundBinary(data, 'Kinderen.xlsx'));
    }
  });

};

export const downloadChildrenWithRemarks: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {

  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  exportService.downloadChildrenWithRemarks(createDbName(tenant), (err, data) => {
    if (err) {
      if (err.error && err.error === 'not_found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.foundBinary(data, 'Kinderen met opmerking.xlsx'));
    }
  });

};

export const downloadCrew: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {

  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    cb(null, responseBuilder.tenantQsMissingResponse());
    return;
  }

  const tenant = event.queryStringParameters['tenant'];

  exportService.downloadCrew(createDbName(tenant), (err, data) => {
    if (err) {
      if (err.error && err.error === 'not_found') {
        cb(null, responseBuilder.notFoundResponse());
      } else {
        cb(null, responseBuilder.unexpectedError(err));
      }
    } else {
      cb(null, responseBuilder.foundBinary(data, 'Animatoren.xlsx'));
    }
  });

};



