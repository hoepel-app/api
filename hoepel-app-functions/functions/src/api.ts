import * as express from "express";
import * as cors from 'cors';
import * as functions from "firebase-functions";
import { firebaseIsAuthenticatedMiddleware } from './middleware/is-authenticated.middleware';
import * as admin from 'firebase-admin';
import { firebaseHasPermissionMiddleware } from "./middleware/has-permission.middleware";
import { UserService } from "./services/user.service";

const db = admin.firestore();
const auth = admin.auth();
const app = express();

const userService = new UserService(db, auth);

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

// Parse Firebase tokens
app.use(firebaseIsAuthenticatedMiddleware(admin));


app.put('/user/accept/privacy-policy', (req, res) => userService.acceptPrivacyPolicy(res.locals.user.uid).then(_ => {
  res.status(200).send({});
}).catch(err => {
  console.error(`Could not accept privacy policy (${res.locals.user.uid})`, err);
  res.sendStatus(500);
}));

app.put('/user/accept/terms-and-conditions', (req, res) => userService.acceptTermsAndConditions(res.locals.user.uid).then(_ => {
  res.status(200).send({});
}).catch(err => {
  console.error(`Could not accept terms and conditions (${res.locals.user.uid})`, err);
  res.sendStatus(500);
}));

app.get('/who-am-i', (req, res) => {
  res.json({
    email: res.locals.user.email,
    uid: res.locals.user.uid,
    token: res.locals.user,
    message: `You're logged in as ${res.locals.user.email} with Firebase UID: ${res.locals.user.uid}`
  });
});

export const api = functions.region('europe-west1').https.onRequest(app);
