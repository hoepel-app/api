import {APIGatewayEvent, Handler} from "aws-lambda";
import {ResponseBuilder} from "../response-builder";
import {ReportService} from "../services/report-service";
import {childRepository} from "./children";
import {crewRepository} from "./crew-members";
import {ChildAttendanceService} from "../services/child-attendance-service";
import {createDbName} from "../create-db-name";
import {dayRepository} from "./days";
import {CrewAttendanceService} from "../services/crew-attendance-service";
import {FiscalCertificateReportService} from "../services/fiscal-certificate-report-service";
import {contactPersonRepository} from "./contact-people";

// Helpers

const responseBuilder = new ResponseBuilder();
const reportService = new ReportService(childRepository, crewRepository, dayRepository, new ChildAttendanceService(), new CrewAttendanceService());
const fiscalCertificateReportService = new FiscalCertificateReportService(childRepository, contactPersonRepository, dayRepository, new ChildAttendanceService());

// API

export const childAttendanceReport: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const year = Number(event.pathParameters['year']);

  if (isNaN(year)) {
    return responseBuilder.unexpectedError('Not a number: ' + year);
  }

  const tenant = event.queryStringParameters['tenant'];

  try {
    const sheet = await reportService.childAttendanceReport(createDbName(tenant), year);
    return responseBuilder.foundBinary(sheet, `Aanwezigheden kinderen in ${year}.xlsx`);
  } catch (e) {
    if (e.error && e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};

export const crewAttendanceReport: Handler = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const year = Number(event.pathParameters['year']);

  if (isNaN(year)) {
    return responseBuilder.unexpectedError('Not a number: ' + year);
  }

  const tenant = event.queryStringParameters['tenant'];

  try {
    const sheet = await reportService.crewAttendanceReport(createDbName(tenant), year);
    return responseBuilder.foundBinary(sheet, `Aanwezigheden animatoren in ${year}.xlsx`);
  } catch (e) {
    if (e.error && e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};

export const fiscalCertificateSheet = async (event: APIGatewayEvent) => {
  // check if tenant query string is set
  if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
    return responseBuilder.tenantQsMissingResponse();
  }

  const year = Number(event.pathParameters['year']);

  if (isNaN(year)) {
    return responseBuilder.unexpectedError('Not a number: ' + year);
  }

  const tenant = event.queryStringParameters['tenant'];

  try {
    const sheet = await fiscalCertificateReportService.fiscalCertificateSheet(createDbName(tenant), year);
    return responseBuilder.foundBinary(sheet, `Data fiscale attesten ${year}.xlsx`);
  } catch (e) {
    if (e.error && e.error == 'not_found') {
      return responseBuilder.notFoundResponse();
    } else {
      return responseBuilder.unexpectedError(e);
    }
  }
};
