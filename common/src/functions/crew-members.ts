import { GenericApiHandlers } from '../generic-api-handlers';

const handlers = new GenericApiHandlers('ICrew', 'all-crew', 'type/crew/v1');

export const all = handlers.all;
export const byId = handlers.byId;
export const create = handlers.create;
export const update = handlers.update;
export const remove = handlers.delete;

export const crewRepository = handlers.repository;
