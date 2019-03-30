import { Router } from 'express';
import * as admin from "firebase-admin";
import { Child, IChild, Tenant } from "@hoepel.app/types";
import { firebaseIsAuthenticatedSpeelpleinwerkingDotComMiddleware } from "../middleware/is-authenticated.middleware";

const db = admin.firestore();

export const router = Router();

router.use(firebaseIsAuthenticatedSpeelpleinwerkingDotComMiddleware(admin));

router.get('/organisation', async (req, res) => {

  // Hide these organisations
  const filteredOrganisationIds = ['example', 'demo'];

  // TODO Don't show all properties, such as contact person
  const all: ReadonlyArray<Tenant> = (await db.collection('tenants').get()).docs.map(doc => {
    return { ...doc.data(), id: doc.id } as Tenant;
  });

  res.json(all.filter(org => filteredOrganisationIds.indexOf(org.id) === -1));
});

router.get('/organisation/:organisation', async (req, res) => {
  // TODO Don't show all properties, such as contact person
  const org = await db.collection('tenants').doc(req.params.organisation).get();

  if (org.exists) {
    res.json(org.data());
  } else {
    res.sendStatus(404);
  }
});

router.get('/organisation/:organisation/children/managed-by/:parentUid', async (req, res) => {
  const parentUid = req.params.parentUid;
  const organisationId = req.params.organisation;

  if (parentUid !== res.locals.user.uid) {
    res.send(403).json({ error: 'You can only view children managed by yourself' });
    return;
  }

  const children: ReadonlyArray<Child> = (await db.collection('children')
      .where('managedByParents', 'array-contains', parentUid)
      .where('tenant', '==', organisationId)
      .get()
  ).docs.map(snapshot => new Child({ ...snapshot.data() as IChild, id: snapshot.id }));

  res.json(children);
});
