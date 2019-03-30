import * as express from "express";
import * as cors from 'cors';
import * as functions from "firebase-functions";
import { firebaseIsAuthenticatedMiddleware } from './middleware/is-authenticated.middleware';
import * as admin from 'firebase-admin';
import { firebaseHasPermissionMiddleware, firebaseIsAdminMiddleware } from "./middleware/has-permission.middleware";

import { router as userRoutes } from './routes/user.routes';
import { router as speelpleinwerkingDotComRoutes } from './routes/speelpleinwerking.com.routes';

const db = admin.firestore();
const auth = admin.auth();
const app = express();


// Automatically allow cross-origin requests
app.use(cors({origin: true}));

// Parse Firebase tokens
app.use('/user', firebaseIsAuthenticatedMiddleware(admin));

// Mount routes
app.use('/speelpleinwerking.com', speelpleinwerkingDotComRoutes);
app.use('/user', userRoutes);


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
