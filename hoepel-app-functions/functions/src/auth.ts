import * as functions from 'firebase-functions';
const admin = require('firebase-admin');
const auth = admin.auth();
const db = admin.firestore();

export const getAllUsers = functions.region('europe-west1').https.onCall(async (data: { maxResults?: number, pageToken?: string }, context) => {
  const isAdmin = context.auth.token.isAdmin;

  if (!isAdmin) {
    throw Error(`User is not admin. UID: ${context.auth.uid}`);
  }

  return await auth.listUsers(data.maxResults, data.pageToken);
});

export const getUserByUid = functions.region('europe-west1').https.onCall(async (uid: string, context) => {
  const isAdmin = context.auth.token.isAdmin;

  if (!isAdmin) {
    throw Error(`User is not admin. UID: ${context.auth.uid}`);
  }

  return await auth.getUser(uid).catch(err => null);
});

export const updateUserTenants = functions.region('europe-west1').https.onCall(async (data: { uid: string, tenants: { [tenant: string]: string } }, context) => {
  const isAdmin = context.auth.token.isAdmin;

  if (!isAdmin) {
    throw Error(`User is not admin. UID: ${context.auth.uid}`);
  }

  const user = await auth.getUser(data.uid);

  const newClaims = { ...(user.customClaims || {}), tenants: data.tenants };

  return await auth.setCustomUserClaims(data.uid, newClaims);
});

export const changeOwnDisplayName = functions.region('europe-west1').https.onCall(async (data: { displayName: string }, context) => {
  // Update in Firestore
  await db.collection('users').doc(context.auth.uid).set({ displayName: data.displayName }, { merge: true });

  // Update user property
  await auth.updateUser(context.auth.uid, {
    displayName: data.displayName,
  });

  return {};
});
