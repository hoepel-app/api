import * as express from 'express';
import * as cors from 'cors';
import * as functions from 'firebase-functions';
const Sentry = require('@sentry/node');
import { logRequestStart } from './util/log-request';

const app = express();

Sentry.init({ dsn: 'https://e2b8d5b8c87143948e4a0ca794fd06b2@sentry.io/1474167' });
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());

// Log all requests
app.use(logRequestStart);

// Automatically allow cross-origin requests
app.use(cors({origin: true}));

// Mount routes
app.use('/speelpleinwerking.com', require('./routes/speelpleinwerking.com.routes').router);
app.use('/user', require('./routes/user.routes').router);
app.use('/organisation', require('./routes/organisation.routes').router);

app.use('/:tenant/files', (req, res, next) => {
  res.locals.tenant = req.params.tenant;
  next();
}, require('./routes/files.routes').router);

app.use('/:tenant/templates', (req, res, next) => {
  res.locals.tenant = req.params.tenant;
  next();
}, require('./routes/templates.routes').router);

app.use((err, req, res, next) => {
  console.error(err);
  if (err.cause) {
    console.error('Cause:');
    console.error(err.cause);
  }

  res.status(500).json({
    status: 'error',
    message: err.message,
    cause: (err.cause || {}).message,
   });
});

export const api = functions.region('europe-west1').https.onRequest(app);
