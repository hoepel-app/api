// Based on https://github.com/antonybudianto/express-firebase-middleware
import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyJwt } from "../parents/verify-jwt";

export const firebaseIsAuthenticatedMiddleware = (admin: any): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): any => {
    const authorization = req.header('Authorization');
    if (authorization) {
      const token = authorization.split(' ');
      admin.auth().verifyIdToken(token[1])
        .then((decodedToken) => {
          res.locals.user = decodedToken;
          next();
        })
        .catch(err => {
          res.status(401).send({ error: 'Could not verify token' });
        });
    } else {
      res.status(401).send({ error: 'Authorization not found' });
    }
  }
};

export const firebaseIsAuthenticatedSpeelpleinwerkingDotComMiddleware = (admin: any): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): any => {

    const authorization = req.header('Authorization');

    if (authorization) {
      const token = authorization.split(' ');

      verifyJwt(token[1])
        .then((decodedToken) => {
          if (!decodedToken) {
            throw new Error('Could not verify token');
          } else {
            res.locals.user = decodedToken;
            next();
          }
        })
        .catch(err => {
          res.status(401).send({ error: 'Could not verify token' });
        });
    } else {
      res.status(401).send({ error: 'Authorization not found' });
    }
  }
};


