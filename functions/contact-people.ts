import { GenericApiHandlers } from './common/generic-api-handlers';

const handlers = new GenericApiHandlers('IContactPerson', 'all-contactperson', 'type/contactperson/v1');

export const all = handlers.all;
export const byId = handlers.byId;
export const create = handlers.create;
export const update = handlers.update;
export const remove = handlers.delete;
