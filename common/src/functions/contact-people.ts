import { GenericApiHandlers } from '../generic-api-handlers';
import {IContactPerson} from "types.hoepel.app";

const handlers = new GenericApiHandlers<IContactPerson>('IContactPerson', 'all-contactperson', 'type/contactperson/v1');

export const all = handlers.all;
export const byId = handlers.byId;
export const create = handlers.create;
export const update = handlers.update;
export const remove = handlers.delete;

export const contactPersonRepository = handlers.repository;
