import * as express from 'express';
import * as cors from 'cors';
import * as functions from 'firebase-functions';

const app = express();

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

app.get('/who-am-i', (req, res) => {
  res.json({
    data: {
      email: res.locals.user.email,
      uid: res.locals.user.uid,
      token: res.locals.user,
      message: `You're logged in as ${res.locals.user.email} with Firebase UID: ${res.locals.user.uid}`
    }
  });
});

export const api = functions.region('europe-west1').https.onRequest(app);
