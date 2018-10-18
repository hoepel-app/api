import { APIGatewayEvent, Handler } from 'aws-lambda';
import { ResponseBuilder } from '../response-builder';
import { ExportService } from '../services/export-service';
import { childRepository } from './children';
import { createDbName } from '../create-db-name';
import {crewRepository} from "./crew-members";

// Helpers

const responseBuilder = new ResponseBuilder();
const exportService = new ExportService(childRepository, crewRepository);

// API

export const downloadChildren: Handler = async (event: APIGatewayEvent) => {

  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  try {
    const sheet = await exportService.downloadChildren(createDbName(tenant));
    return responseBuilder.foundBinary(sheet, 'Kinderen.xlsx');
  } catch (e) {
    if (e.error && e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};

export const downloadChildrenWithRemarks: Handler = async (event: APIGatewayEvent) => {

  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  try {
    const sheet = await exportService.downloadChildrenWithRemarks(createDbName(tenant));
    return responseBuilder.foundBinary(sheet, 'Kinderen met opmerking.xlsx');
  } catch (e) {
    if (e.error && e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};

export const downloadCrew: Handler = async (event: APIGatewayEvent) => {

  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const tenant = event.queryStringParameters['tenant'];

  try {
    const sheet = await exportService.downloadCrew(createDbName(tenant));
    return responseBuilder.foundBinary(sheet, 'Animatoren.xlsx');
  } catch (e) {
    if (e.error && e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};
