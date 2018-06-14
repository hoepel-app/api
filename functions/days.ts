import { ApiHandlers } from './common/api-handlers';

const handlers = new ApiHandlers('Day', 'all-days', 'type/day/v1');

export const all = handlers.all;
export const byId = handlers.byId;
export const create = handlers.create;
export const update = handlers.update;
export const remove = handlers.delete;
