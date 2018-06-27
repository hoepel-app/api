import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { TenantService } from './services/tenant-service';
import { ResponseBuilder } from './common/response-builder';

// Helpers
const tenantService = new TenantService();
const responseBuilder = new ResponseBuilder();

// API
export const getAll: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  tenantService.getAll((err, data) => {
    if (err) {
      cb(null, responseBuilder.unexpectedError(err));
    } else {
      cb(null, responseBuilder.found(data));
    }
  })
};

export const details: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  const tenant = event.pathParameters['name'];

  tenantService.details(tenant, (err, details) => {
    if (err) {
      cb(null, responseBuilder.unexpectedError(err));
    } else {
      cb(null, responseBuilder.found(details));
    }
  });
};

export const create: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  const tenant = event.pathParameters['name'];

  tenantService.create(tenant, (err, data) => {
    if (err) {
      cb(null, responseBuilder.unexpectedError(err));
    } else {
      cb(null, responseBuilder.created(tenant));
    }
  });
};

export const createDesignDocs: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  const tenant = event.pathParameters['name'];

  tenantService.createDesignDocs(tenant, (err, data) => {
    if (err) {
      cb(null, responseBuilder.unexpectedError(err));
    } else {
      // cb(null, responseBuilder.updated('design docs'));
      cb(null, responseBuilder.updated(data));
    }
  });
};

export const syncTo: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  const tenant = event.pathParameters['name'];

  cb(null, responseBuilder.notImplemented());
};

export const syncFrom: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
  const tenant = event.pathParameters['name'];

  cb(null, responseBuilder.notImplemented());
};
