import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { verify } from './verify-schema';
import { ResponseBuilder } from './response-builder';
import { tryParseJson } from './try-parse-json';
import { GenericRepository } from './services/generic-repository';
import { createAuthorizer } from './authorizers/generic-authorizer';
import { IPermission, Permission } from 'types.hoepel.app/dist/src/permission';

export const getPermissions = (prefix: string): {
    allPermission: IPermission,
    byIdPermission: IPermission,
    createPermission: IPermission,
    updatePermission: IPermission,
    deletePermission: IPermission,
} => {
  return {
      allPermission: Permission.parsePermissionName(prefix + 'retrieve'),
      byIdPermission: Permission.parsePermissionName(prefix + 'retrieve'),
      createPermission: Permission.parsePermissionName(prefix + 'create'),
      updatePermission: Permission.parsePermissionName(prefix + 'update'),
      deletePermission: Permission.parsePermissionName(prefix + 'delete'),
  };
};

export class GenericApiHandlers<T> {
  private readonly databasePrefix = 'ic-';

  private responseBuilder = new ResponseBuilder();

  public repository: GenericRepository<T>;

  constructor(
    private schemaName: string,
    private viewName: string,
    private kind: string,
    private permissions: {
      allPermission: IPermission,
      byIdPermission: IPermission,
      createPermission: IPermission,
      updatePermission: IPermission,
      deletePermission: IPermission,
    },
    private designName = 'default',
  ) {
    this.repository = new GenericRepository<T>(viewName, kind, designName);
  }

  public all: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
      cb(null, this.responseBuilder.tenantQsMissingResponse());
      return;
    }

    const tenant = event.queryStringParameters['tenant'];

    this.repository.all(this.createDbName(tenant), (err, data) => {
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.responseBuilder.notFoundResponse());
        } else {
          console.error('unexpected error', err);
          cb(null, this.responseBuilder.unexpectedError(err));
        }
      } else {
        cb(null, this.responseBuilder.found(data));
      }
    });
  };

  public allAuthorizer = createAuthorizer(this.permissions.allPermission);

  public byId: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters['tenant']) {
      cb(null, this.responseBuilder.tenantQsMissingResponse());
      return;
    }

    const tenant = event.queryStringParameters['tenant'];

    this.repository.byId(this.createDbName(tenant), event.pathParameters['id'], (err, data) => {
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.responseBuilder.notFoundResponse());
        } else {
          console.error('unexpected error', err);
          cb(null, this.responseBuilder.unexpectedError(err));
        }
      } else {
        cb(null, this.responseBuilder.found(data));
      }
    });
  };

  public byIdAuthorizer = createAuthorizer(this.permissions.byIdPermission);

  public create: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters['tenant']) {
      cb(null, this.responseBuilder.tenantQsMissingResponse());
      return;
    }

    // check if body is valid JSON
    const body = tryParseJson(event.body);

    if (!body) {
      cb(null, this.responseBuilder.bodyMissingOrNotValidJson());
      return;
    }

    // check if body conforms to schema
    const valid = verify(this.schemaName, body);

    if (!valid.valid) {
      cb(null, this.responseBuilder.jsonNotConformingToSchema(valid.errors));
      return;
    }

    const tenant = event.queryStringParameters['tenant'];

    this.repository.create(this.createDbName(tenant), body, (err, newId) => {
      // handle missing db
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.responseBuilder.notFoundResponse());
        } else {
          console.error('unexpected error', err);
          cb(null, this.responseBuilder.unexpectedError(err));
        }
      } else {
        cb(null, this.responseBuilder.created(newId));
      }
    });
  };

  public createAuthorizer = createAuthorizer(this.permissions.createPermission);

  public update: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters['tenant']) {
      cb(null, this.responseBuilder.tenantQsMissingResponse());
      return;
    }

    // check if body is valid JSON
    const body = tryParseJson(event.body);

    if (!body) {
      cb(null, this.responseBuilder.bodyMissingOrNotValidJson());
      return;
    }

    // check if body conforms to schema
    const valid = verify(this.schemaName, body);

    if (!valid.valid) {
      cb(null, this.responseBuilder.jsonNotConformingToSchema(valid.errors));
      return;
    }

    const tenant = event.queryStringParameters['tenant'];

    this.repository.update(this.createDbName(tenant), body, event.pathParameters['id'], (err, updatedId) => {
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.responseBuilder.notFoundResponse());
        } else {
          console.error('unexpected error', err);
          cb(null, this.responseBuilder.unexpectedError(err));
        }
      } else {
        cb(null, this.responseBuilder.updated(updatedId));
      }
    });
  };

  public updateAuthorizer = createAuthorizer(this.permissions.updatePermission);

  public delete: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters['tenant']) {
      cb(null, this.responseBuilder.tenantQsMissingResponse());
      return;
    }

    const tenant = event.queryStringParameters['tenant'];

    this.repository.delete(this.createDbName(tenant), event.pathParameters['id'], (err, deletedId) => {
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.responseBuilder.notFoundResponse());
        } else {
          console.error('unexpected error', err);
          cb(null, this.responseBuilder.unexpectedError(err));
        }
      } else {
        cb(null, this.responseBuilder.deleted(deletedId))
      }
    });
  };

  public deleteAuthorizer = createAuthorizer(this.permissions.deletePermission);

  private createDbName(tenantName: string) {
    return this.databasePrefix + tenantName;
  }
}
