import { APIGatewayEvent, Handler } from 'aws-lambda';
import { verify } from './verify-schema';
import { ResponseBuilder } from './response-builder';
import { tryParseJson } from './try-parse-json';
import { GenericRepository } from './services/generic-repository';
import {id} from "aws-sdk/clients/datapipeline";

export class GenericApiHandlers<T> {
  private readonly databasePrefix = 'ic-';

  private responseBuilder = new ResponseBuilder();

  public repository: GenericRepository<T>;

  constructor(
    private schemaName: string,
    private viewName: string,
    private kind: string,
    private designName = '_design/default',
  ) {
    this.repository = new GenericRepository<T>(viewName, kind, designName);
  }

  public all: Handler = async (event: APIGatewayEvent) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
      return this.responseBuilder.tenantQsMissingResponse();
    }

    const tenant = event.queryStringParameters['tenant'];

    try {
      const all = await this.repository.all(this.createDbName(tenant));
      return this.responseBuilder.found(all);
    } catch (e) {
      if (e.error && e.error == 'not_found') {
        return this.responseBuilder.notFoundResponse();
      } else {
        return this.responseBuilder.unexpectedError(e);
      }
    }
  };

  public byId: Handler = async (event: APIGatewayEvent) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters['tenant']) {
      return this.responseBuilder.tenantQsMissingResponse();
    }

    const tenant = event.queryStringParameters['tenant'];

    try {
      const entity = await this.repository.byId(this.createDbName(tenant), event.pathParameters['id']);
      return this.responseBuilder.found(entity);
    } catch (e) {
      if (e.error && e.error == 'not_found') {
        return this.responseBuilder.notFoundResponse();
      } else {
        return this.responseBuilder.unexpectedError(e);
      }
    }
  };

  public create: Handler = async (event: APIGatewayEvent) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters['tenant']) {
      return this.responseBuilder.tenantQsMissingResponse();
    }

    // check if body is valid JSON
    const body = tryParseJson(event.body);

    if (!body) {
      return this.responseBuilder.bodyMissingOrNotValidJson();
    }

    // check if body conforms to schema
    const valid = verify(this.schemaName, body);

    if (!valid.valid) {
      return this.responseBuilder.jsonNotConformingToSchema(valid.errors);
    }

    const tenant = event.queryStringParameters['tenant'];

    try {
      const id = await this.repository.create(this.createDbName(tenant), body);
      return this.responseBuilder.created(id);
    } catch (e) {
      if (e.error && e.error == 'not_found') {
        return this.responseBuilder.notFoundResponse();
      } else {
        return this.responseBuilder.unexpectedError(e);
      }
    }
  };

  public update: Handler = async (event: APIGatewayEvent) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters['tenant']) {
      return this.responseBuilder.tenantQsMissingResponse();
    }

    // check if body is valid JSON
    const body = tryParseJson(event.body);

    if (!body) {
      return this.responseBuilder.bodyMissingOrNotValidJson();
    }

    // check if body conforms to schema
    const valid = verify(this.schemaName, body);

    if (!valid.valid) {
      return this.responseBuilder.jsonNotConformingToSchema(valid.errors);
    }

    const tenant = event.queryStringParameters['tenant'];

    try {
      const id = await this.repository.update(this.createDbName(tenant), body, event.pathParameters['id']);
      return this.responseBuilder.updated(id);
    } catch (e) {
      if (e.error && e.error == 'not_found') {
        return this.responseBuilder.notFoundResponse();
      } else {
        return this.responseBuilder.unexpectedError(e);
      }
    }
  };

  public delete: Handler = async (event: APIGatewayEvent) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters['tenant']) {
      return this.responseBuilder.tenantQsMissingResponse();
    }

    const tenant = event.queryStringParameters['tenant'];

    try {
      const id = await this.repository.delete(this.createDbName(tenant), event.pathParameters['id']);
      return this.responseBuilder.deleted(id);
    } catch (e) {
      if (e.error && e.error == 'not_found') {
        return this.responseBuilder.notFoundResponse();
      } else {
        return this.responseBuilder.unexpectedError(e);
      }
    }
  };

  private createDbName(tenantName: string) {
    return this.databasePrefix + tenantName;
  }
}
