import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { nano } from './nano';
import { verify } from './verify-schema';
import * as uuid from 'uuid/v4';

type Status = 'error' | 'success';

export class ApiHandlers {
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

  constructor(
    private schemaName: string,
    private viewName: string,
    private kind: string,
    private designName = 'default',
  ) {

  }

  public all: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters.tenant) {
      cb(null, this.tenantQsMissingResponse);
      return;
    }

    const tenant = event.queryStringParameters['tenant'];
    const db = nano.use(this.databasePrefix + tenant);

    db.view(this.designName, this.viewName, { include_docs: true }, (err, data) => {
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.notFoundResponse);
        } else {
          console.error('unexpected error', err);
          cb(null, this.unexpectedError(err));
        }

        return;
      }

      const docs = data.rows.map(row => Object.assign(row.doc.doc, { id: row.doc._id }) );

      cb(null, this.found(docs));
    });
  };

  public byId: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters['tenant']) {
      cb(null, this.tenantQsMissingResponse);
      return;
    }

    const tenant = event.queryStringParameters['tenant'];
    const db = nano.use(this.databasePrefix + tenant);

    db.get(event.pathParameters['id'], (err, data) => {
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.notFoundResponse);
        } else {
          console.error('unexpected error', err);
          cb(null, this.unexpectedError(err));
        }

        return;
      }

      cb(null, this.found(Object.assign(data.doc, { id: data._id })));
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
    const db = nano.use(this.databasePrefix + tenant);

    db.insert(this.createDoc(uuid(), this.kind, body), (err, res) => {
      // handle missing db
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.notFoundResponse);
        } else {
          console.error('unexpected error', err);
          cb(null, this.unexpectedError(err));
        }

        return;
      }

      cb(null, this.created(res.id));
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
    const db = nano.use(this.databasePrefix + tenant);

    db.get(event.pathParameters['id'], (err, data) => {
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.notFoundResponse);
        } else {
          console.error('unexpected error', err);
          cb(null, this.unexpectedError(err));
        }

        return;
      }

      db.insert(this.createDoc(event.pathParameters['id'], this.kind, body, data._rev), (err, res) => {
        if (err) {
          console.error('unexpected error', err);
          cb(null, this.unexpectedError(err));
          return;
        }

        cb(null, this.updated(res.id));
      });
    });
  };

  public delete: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
    // check if tenant query string is set
    if (!event.queryStringParameters || !event.queryStringParameters['tenant']) {
      cb(null, this.tenantQsMissingResponse);
      return;
    }

    const tenant = event.queryStringParameters['tenant'];
    const db = nano.use(this.databasePrefix + tenant);

    db.get(event.pathParameters['id'], (err, data) => {
      if (err) {
        if (err.error && err.error === 'not_found') {
          cb(null, this.notFoundResponse);
        } else {
          console.error('unexpected error', err);
          cb(null, this.unexpectedError(err));
        }

        return;
      }

      db.destroy(event.pathParameters['id'], data._rev, (err, res) => {
        if (err) {
          console.error('unexpected error', err);
          cb(null, this.unexpectedError(err));
          return;
        }

        cb(null, this.deleted(res.id));
      });
    });
  };

  private createDoc(id, kind, doc, rev?) {
    return {
      _id: id,
      _rev: rev,
      doc,
      kind,
    };
  }

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
}
