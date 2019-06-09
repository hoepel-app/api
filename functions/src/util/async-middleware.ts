import { RequestHandler } from 'express';

export const asyncMiddleware = (fn: RequestHandler) =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
