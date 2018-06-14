import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { verify } from './verify-schema';
import { GenericRepository } from '../services/generic-repository';

type Status = 'error' | 'success';

export class ApiHandlers<T> {
  private readonly databasePrefix = 'ic-';

  private readonly tenantQsMissingResponse = this.buildResponse(400, 'error', undefined, '\'tenant\' missing in query string');
  private readonly notFoundResponse = this.buildResponse(404, 'error', undefined, 'Not found');
  private readonly bodyMissingOrNotValidJson = this.buildResponse(400, 'error', undefined, 'Body not set or not valid JSON');
  private readonly unexpectedError = (error) => this.buildResponse(500, 'error', undefined, 'Unexpected error', error);
  private readonly jsonNotConformingToSchema = (errors) => this.buildResponse(400, 'error', undefined, 'Invalid body: does not conform to schema', errors);
  private readonly created = (id) => this.buildResponse(201, 'success', { id }, 'Created');
  private readonly updated = (id) => this.buildResponse(200, 'success', { id }, 'Updated');
  private readonly deleted = (id) => this.buildResponse(200, 'success', { id }, 'Deleted');
  private readonly found = (doc) => this.buildResponse(200, 'success', doc);

  private repository: GenericRepository<T>;

  constructor(
    private schemaName: string,
    private viewName: string,
    private kind: string,
    private designName = 'default',
  ) {
    this.repository = new GenericRepository<T>(viewName, kind, designName)
  }

  public all: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
      cb(null, this.tenantQsMissingResponse);
      return;
    }

    const tenant = event.queryStringParameters['tenant'];

    this.repository.all(this.createDbName(tenant), (err, data) => {
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.notFoundResponse);
        } else {
          console.error('unexpected error', err);
          cb(null, this.unexpectedError(err));
        }
      } else {
        cb(null, this.found(data));
      }
    });
  };

  public byId: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters['tenant']) {
      cb(null, this.tenantQsMissingResponse);
      return;
    }

    const tenant = event.queryStringParameters['tenant'];

    this.repository.byId(this.createDbName(tenant), event.pathParameters['id'], (err, data) => {
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.notFoundResponse);
        } else {
          console.error('unexpected error', err);
          cb(null, this.unexpectedError(err));
        }
      } else {
        cb(null, this.found(data));
      }
    });
  };

  public create: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters['tenant']) {
      cb(null, this.tenantQsMissingResponse);
      return;
    }

    // check if body is valid JSON
    const body = this.tryParseJson(event.body);

    if (!body) {
      cb(null, this.bodyMissingOrNotValidJson);
      return;
    }

    // check if body conforms to schema
    const valid = verify(this.schemaName, body);

    if (!valid.valid) {
      cb(null, this.jsonNotConformingToSchema(valid.errors));
      return;
    }

    const tenant = event.queryStringParameters['tenant'];

    this.repository.create(this.createDbName(tenant), body, (err, newId) => {
      // handle missing db
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.notFoundResponse);
        } else {
          console.error('unexpected error', err);
          cb(null, this.unexpectedError(err));
        }
      } else {
        cb(null, this.created(newId));
      }
    });
  };

  public update: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters['tenant']) {
      cb(null, this.tenantQsMissingResponse);
      return;
    }

    // check if body is valid JSON
    const body = this.tryParseJson(event.body);

    if (!body) {
      cb(null, this.bodyMissingOrNotValidJson);
      return;
    }

    // check if body conforms to schema
    const valid = verify(this.schemaName, body);

    if (!valid.valid) {
      cb(null, this.jsonNotConformingToSchema(valid.errors));
      return;
    }

    const tenant = event.queryStringParameters['tenant'];

    this.repository.update(this.createDbName(tenant), body, event.pathParameters['id'], (err, updatedId) => {
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.notFoundResponse);
        } else {
          console.error('unexpected error', err);
          cb(null, this.unexpectedError(err));
        }
      } else {
        cb(null, this.updated(updatedId));
      }
    });
  };

  public delete: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters['tenant']) {
      cb(null, this.tenantQsMissingResponse);
      return;
    }

    const tenant = event.queryStringParameters['tenant'];

    this.repository.delete(this.createDbName(tenant), event.pathParameters['id'], (err, deletedId) => {
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.notFoundResponse);
        } else {
          console.error('unexpected error', err);
          cb(null, this.unexpectedError(err));
        }
      } else {
        cb(null, this.deleted(deletedId))
      }
    });
  };

  private tryParseJson(input: string) {
    if (!input) {
      return null;
    }

    if(input) {
      try {
        return JSON.parse(input);
      } catch(e) {
        return null;
      }
    }
  }

  private buildResponse(statusCode: number, status: Status, data?, message?, error?) {
    return {
      statusCode,
      body: {
        status,
        message,
        data,
        error,
      }
    }
  }

  private createDbName(tenantName: string) {
    return this.databasePrefix + tenantName;
  }
}
