import { Router } from 'express';
import * as admin from "firebase-admin";
import { Tenant } from "@hoepel.app/types";
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
