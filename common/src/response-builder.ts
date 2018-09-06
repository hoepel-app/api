export type Status = 'error' | 'success';

export class ResponseBuilder {

  constructor() {}

  tenantQsMissingResponse() {
    return this.buildResponse(400, 'error', undefined, '\'tenant\' missing in query string');
  }

  notFoundResponse() {
    return this.buildResponse(404, 'error', undefined, 'Not found');
  }

  bodyMissingOrNotValidJson() {
    return this.buildResponse(400, 'error', undefined, 'Body not set or not valid JSON');
  }
  unexpectedError(error) {
    return this.buildResponse(500, 'error', undefined, 'Unexpected error', error);
  }

  jsonNotConformingToSchema(errors) {
    return this.buildResponse(400, 'error', undefined, 'Invalid body: does not conform to schema', errors);
  }

  created(id) {
    return this.buildResponse(201, 'success', { id }, 'Created');
  }

  updated(id) {
    return this.buildResponse(200, 'success', { id }, 'Updated');
  }

  deleted(id) {
    return this.buildResponse(200, 'success', { id }, 'Deleted');
  }

  found(doc) {
    return this.buildResponse(200, 'success', doc);
  }

  ok() {
    return this.buildResponse(200, 'success');
  }

  foundBinary(base64Doc, fileName: string) {
    return {
      statusCode: 200,
      body: base64Doc,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="' + fileName +'"',
      },
      isBase64Encoded: true,
    };
  }

  notImplemented() {
    return this.buildResponse(501, 'error', 'Not implemented');
  }



  private buildResponse(statusCode: number, status: Status, data?, message?, error?) {
    return {
      statusCode,
      body: JSON.stringify({
        statusCode,
        status,
        message,
        data,
        error,
      }),
    }
  }
}
