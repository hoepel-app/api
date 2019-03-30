import { Router } from 'express';
import * as admin from "firebase-admin";
import { Child, IChild, Tenant } from "@hoepel.app/types";
import { firebaseIsAuthenticatedSpeelpleinwerkingDotComMiddleware } from "../middleware/is-authenticated.middleware";
import { DocumentSnapshot } from "firebase-functions/lib/providers/firestore";

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

router.get('/organisation/:organisation/children/managed-by/me', async (req, res) => {
  const parentUid = res.locals.user.uid;
  const organisationId = req.params.organisation;

  const children: ReadonlyArray<Child> = (await db.collection('children')
      .where('managedByParents', 'array-contains', parentUid)
      .where('tenant', '==', organisationId)
      .get()
  ).docs.map(snapshot => new Child({ ...snapshot.data() as IChild, id: snapshot.id }));

  res.json(children);
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

router.put('/organisation/:organisation/children/:child', async (req, res) => {
  const childId = req.params.child;
  const organisationId = req.params.organisation;
  const parentUid = res.locals.user.uid;

  const snapshot: DocumentSnapshot = (await db.collection('children').doc(childId).get());

  if (!snapshot.exists) {
    res.status(404).json({ error: 'Child not found' });
  } else if (snapshot.data().tenant !== organisationId) {
    res.status(403).json({ error: `Tenant id on child (${snapshot.data().tenant}) does not match given tenant id (${organisationId})` });
  } else if ((snapshot.data().managedByParents || [] as ReadonlyArray<string>).indexOf(parentUid) === -1) {
    res.status(403).json({ error: `Parent can not edit child since parent uid (${parentUid}) is not included in ${JSON.stringify(snapshot.data().managedByParents)}` });
  } else {

    // First, create a new child object. This way, only valid properties are kept
    // Then stringify and parse as JSON. We get a plain JS object
    // Finally, drop the id
    const { id, ...newChild } = JSON.parse(JSON.stringify(new Child(req.body.child)));
    const newChildWithTenant = { ...newChild, tenant: organisationId };

    await db.collection('children').doc(childId).set(newChildWithTenant);

    res.sendStatus(200);
  }
});

router.post('/organisation/:organisation/children', async (req, res) => {
  const organisationId = req.params.organisation;
  const parentUid = res.locals.user.uid;

  // First, create a new child object. This way, only valid properties are kept
  // Then stringify and parse as JSON. We get a plain JS object
  // Finally, drop the id
  const { id, ...newChild } = JSON.parse(JSON.stringify(new Child(req.body.child).withManagedByParents([ parentUid ])));
  const newChildWithTenant = { ...newChild, tenant: organisationId };

  await db.collection('children').add(newChildWithTenant);

  res.sendStatus(200);
});
