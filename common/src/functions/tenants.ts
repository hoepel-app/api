import { APIGatewayEvent, Handler } from 'aws-lambda';
import { TenantService } from '../services/tenant-service';
import { ResponseBuilder } from '../response-builder';

// Helpers
const tenantService = new TenantService();
const responseBuilder = new ResponseBuilder();

// API
export const getAll: Handler = async (event: APIGatewayEvent) => {
  try {
    const tenants = await tenantService.getAll();
    return responseBuilder.found(tenants);
  } catch (e) {
    return responseBuilder.unexpectedError(e);
  }
};

export const details: Handler = async (event: APIGatewayEvent) => {
  const tenant = event.pathParameters['name'];

  try {
    const details = await tenantService.details(tenant);
    return responseBuilder.found(details);
  } catch (e) {
    return responseBuilder.unexpectedError(e);
  }
};

export const create: Handler = async (event: APIGatewayEvent) => {
  const tenant = event.pathParameters['name'];

  try {
    await tenantService.create(tenant);
    return responseBuilder.created(tenant);
  } catch (e) {
    return responseBuilder.unexpectedError(e);
  }
};

export const createDesignDocs: Handler = async (event: APIGatewayEvent) => {
  const tenant = event.pathParameters['name'];

  try {
    await tenantService.createDesignDocs(tenant);
    return responseBuilder.created(tenant);
  } catch (e) {
    return responseBuilder.unexpectedError(e);
  }
};

export const syncTo: Handler = async (event: APIGatewayEvent) => {
  const tenant = event.pathParameters['name'];

  return responseBuilder.notImplemented();
};

export const syncFrom: Handler = async (event: APIGatewayEvent) => {
  const tenant = event.pathParameters['name'];

  return responseBuilder.notImplemented();
};
