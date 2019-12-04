import * as express from 'express';
import * as cors from 'cors';
import * as functions from 'firebase-functions';
const Sentry = require('@sentry/node');
import { logRequestStart } from './util/log-request';
import { RELEASE_ID } from './release';

const app = express();

Sentry.init({
  dsn: 'https://e2b8d5b8c87143948e4a0ca794fd06b2@sentry.io/1474167',
  release: RELEASE_ID,
});

app.use(Sentry.Handlers.requestHandler());

// Log all requests
app.use(logRequestStart);

// Automatically allow cross-origin requests
app.use(cors({origin: true}));

// Mount routes
app.use('/graphql', require('./routes/graphql.routes').router);

app.use('/speelpleinwerking.com', require('./routes/speelpleinwerking.com.routes').router);
app.use('/user', require('./routes/user.routes').router);
app.use('/organisation', require('./routes/organisation.routes').router);

app.use('/version', (req, res, next) => res.json({ release: RELEASE_ID }));

// Error handlers

app.use(
  (err, req, res, next) => {
    Sentry.configureScope((scope) => {
      scope.setUser({
        email: res.locals.user?.email,
        id: res.locals.user?.uid,
        username: res.locals.user?.name,
        ip_address: req.header('X-Forwarded-For'),
      });

      if (req.params.tenant) {
        scope.setExtra('tenant', req.params.tenant);
      }

      next(err);
    });
  },
  Sentry.Handlers.errorHandler(),
);

app.use((err, req, res, next) => {
  console.error(err);
  if (err.cause) {
    console.error('Cause:');
    console.error(err.cause);
  }

  res.status(500).json({
    status: 'error',
    message: err.message,
    cause: err.cause?.message,
   });
});

export const api = functions.region('europe-west1').https.onRequest(app);
