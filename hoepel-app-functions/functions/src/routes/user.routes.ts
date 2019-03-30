import { firebaseIsAdminMiddleware } from "../middleware/has-permission.middleware";
import { Router } from 'express';
import { UserService } from "../services/user.service";
import * as admin from "firebase-admin";
import { firebaseIsAuthenticatedMiddleware } from "../middleware/is-authenticated.middleware";

const db = admin.firestore();
const auth = admin.auth();
const userService = new UserService(db, auth);

export const router = Router();


// Parse Firebase tokens
router.use(firebaseIsAuthenticatedMiddleware(admin));


// Routes

router.put('/accept/privacy-policy', (req, res) => userService.acceptPrivacyPolicy(res.locals.user.uid).then(_ => {
  res.status(200).json({});
}).catch(err => {
  console.error(`Could not accept privacy policy (${res.locals.user.uid})`, err);
  res.status(500).json({});
}));

router.put('/accept/terms-and-conditions', (req, res) => userService.acceptTermsAndConditions(res.locals.user.uid).then(_ => {
  res.status(200).json({});
}).catch(err => {
  console.error(`Could not accept terms and conditions (${res.locals.user.uid})`, err);
  res.status(500).json({});
}));

router.get('/all', firebaseIsAdminMiddleware(db), (req, res) => {
  const maxResults = parseInt(req.query.maxResults, 10);
  userService.getUsers(maxResults || undefined, req.query.pageToken || undefined).then(data => {
    res.json({ data });
  }).catch(err => {
    console.error('Could not get all users', err);
    res.status(500).json({});
  });
});

router.get('/:uid', firebaseIsAdminMiddleware(db), (req, res) => {
  userService.getUser(req.params.uid).then(data => {
    res.json({ data });
  }).catch(err => {
    console.error(`Could not get user with id ${req.params.uid}`, err);
    res.status(500).json({});
  });
});

router.put('/:uid/display-name', async (req, res) => {
  try {
    const displayName = req.body.displayName;

    if (!displayName) {
      res.status(400).json({ error: 'Missing displayName property in body' });
      return;
    }

    await userService.updateDisplayName(req.params.uid, req.body.displayName);

    res.status(200).json({});
  } catch (err) {
    console.log(`Could not update displayName for user ${req.params.uid}`, err);
    res.status(500);
  }
});
