import { GenericApiHandlers, getPermissions } from '../generic-api-handlers';
import { IChild } from 'types.hoepel.app';

const handlers = new GenericApiHandlers<IChild>('IChild', 'all-children', 'type/child/v1', getPermissions('child:'));

export const all = handlers.all;
export const byId = handlers.byId;
export const create = handlers.create;
export const update = handlers.update;
export const remove = handlers.delete;

export const allAuthorizer = handlers.allAuthorizer;
export const byIdAuthorizer = handlers.byIdAuthorizer;
export const createAuthorizer = handlers.createAuthorizer;
export const updateAuthorizer = handlers.updateAuthorizer;
export const removeAuthorizer = handlers.deleteAuthorizer;

export const childRepository = handlers.repository;
