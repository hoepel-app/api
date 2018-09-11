import { ResponseBuilder } from './response-builder';

export class LoggingResponseBuilder {
    private readonly responseBuilder = new ResponseBuilder();

    constructor() {}

    tenantQsMissingResponse() {
        return this.responseBuilder.tenantQsMissingResponse();
    }

    notFoundResponse() {
        return this.responseBuilder.notFoundResponse();
    }

    bodyMissingOrNotValidJson() {
        return this.responseBuilder.bodyMissingOrNotValidJson();
    }
    unexpectedError(error) {
        return this.responseBuilder.unexpectedError(error);
    }

    jsonNotConformingToSchema(errors) {
        return this.responseBuilder.jsonNotConformingToSchema(errors);
    }

    created(id) {
        return this.responseBuilder.created(id);
    }

    updated(id) {
        return this.responseBuilder.updated(id);
    }

    deleted(id) {
        return this.responseBuilder.deleted(id);
    }

    found(doc) {
        return this.responseBuilder.found(doc);
    }

    ok() {
        return this.responseBuilder.ok();
    }

    foundBinary(base64Doc, fileName: string) {
        return this.responseBuilder.foundBinary(base64Doc, fileName);
    }

    notImplemented() {
        return this.responseBuilder.notImplemented();
    }

}