import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const userAcceptTermsAndConditions = functions
  .region('europe-west1')
  .https.onCall(async (data: { priming: boolean}, context) => {
    if (data.priming) {
      return;
    }

    const uid = context.auth.uid;

    await db.collection('users').doc(uid).set({ acceptedTermsAndConditions: new Date() }, { merge: true });

    return;
  });

export const userPrivacyPolicy = functions
  .region('europe-west1')
  .https.onCall(async (data: { priming: boolean }, context) => {
    if (data.priming) {
      return;
    }

    const uid = context.auth.uid;

    await db.collection('users').doc(uid).set({ acceptedPrivacyPolicy: new Date() }, { merge: true });

    return;
  });
