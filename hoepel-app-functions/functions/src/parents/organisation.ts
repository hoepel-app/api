import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import {Tenant} from "@hoepel.app/types";
import { verifyJwt } from "./verify-jwt";

const db = admin.firestore();

export const listOrganisations = functions
  .region('europe-west1')
  .https.onCall(async (data: { token: string }, context) => {

    if (!verifyJwt(data.token)) {
      throw new Error('Invalid authentication');
    }

    // TODO Don't show all properties, such as contact person
    const all: ReadonlyArray<Tenant> = (await db.collection('tenants').get()).docs.map(doc => doc.data() as Tenant);


    return all;
  });

