import * as express from "express";
import * as cors from 'cors';
import * as functions from "firebase-functions";
import { firebaseIsAuthenticatedMiddleware } from './middleware/is-authenticated.middleware';
import * as admin from 'firebase-admin';
import { firebaseHasPermissionMiddleware, firebaseIsAdminMiddleware } from "./middleware/has-permission.middleware";
import { UserService } from "./services/user.service";

const db = admin.firestore();
const auth = admin.auth();
const app = express();

const userService = new UserService(db, auth);

// Automatically allow cross-origin requests
app.use(cors({origin: true}));

// Parse Firebase tokens
app.use('/user', firebaseIsAuthenticatedMiddleware(admin));


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

app.get('/user/all', firebaseIsAdminMiddleware(db), (req, res) => {
  const maxResults = parseInt(req.query.maxResults, 10);

  auth.listUsers(maxResults || undefined, req.query.pageToken || undefined).then(data => {
    res.send({ data });
  }).catch(err => {
    console.error('Could not get all users', err);
    res.sendStatus(500);
  });
});

app.get('/user/:uid', firebaseIsAdminMiddleware(db), (req, res) => {
  auth.getUser(req.params.uid).then(data => {
    res.send({ data });
  }).catch(err => {
    console.error(`Could not get user with id ${req.params.uid}`, err);
    res.sendStatus(500);
  });
});

app.put('/user/:uid/display-name', async (req, res) => {
  try {
    const displayName = req.body.displayName;

    if (!displayName) {
      res.status(400).send({ error: 'Missing displayName property in body' });
      return;
    }

    // Update in Firestore
    await db.collection('users').doc(req.params.uid).set({ displayName: displayName }, { merge: true });

    // Update user property
    await auth.updateUser(req.params.uid, {
      displayName: displayName,
    });

    res.status(200).send({});
  } catch (err) {
    console.log(`Could not update displayName for user ${req.params.uid}`, err);
    res.status(500);
  }
});

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
