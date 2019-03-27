import * as functions from 'firebase-functions';
const admin = require('firebase-admin');
const auth = admin.auth();
const db = admin.firestore();

export const changeOwnDisplayName = functions.region('europe-west1').https.onCall(async (data: { displayName: string }, context) => {
  // Update in Firestore
  await db.collection('users').doc(context.auth.uid).set({ displayName: data.displayName }, { merge: true });

  // Update user property
  await auth.updateUser(context.auth.uid, {
    displayName: data.displayName,
  });

  return {};
});
