import { GenericApiHandlers } from '../generic-api-handlers';
import { IChild } from 'types.hoepel.app';

const handlers = new GenericApiHandlers<IChild>('IChild', 'all-children', 'type/child/v1');

export const all = handlers.all;
export const byId = handlers.byId;
export const create = handlers.create;
export const update = handlers.update;
export const remove = handlers.delete;

export const childRepository = handlers.repository;
