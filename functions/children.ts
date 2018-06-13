import { ApiHandlers } from './common/api-handlers';

const handlers = new ApiHandlers('Child', 'all-children', 'type/child/v1');

export const all = handlers.all;
export const byId = handlers.byId;
export const create = handlers.create;
export const update = handlers.update;
export const remove = handlers.delete;
