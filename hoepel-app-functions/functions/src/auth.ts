import * as functions from 'firebase-functions';
const admin = require('firebase-admin');
const auth = admin.auth();

const userIsAdmin: (string) => Promise<boolean>  = async (uid: string) => {
  const user = await auth.getUser(uid);
  return user && user.customClaims && user.customClaims.isAdmin;
};

export const getAllUsers = functions.region('europe-west1').https.onCall(async (data: { maxResults?: number, pageToken?: string }, context) => {
  const isAdmin = await userIsAdmin(context.auth.uid);

  if (!isAdmin) {
    throw Error(`User is not admin. UID: ${context.auth.uid}`);
  }

  return await auth.listUsers(data.maxResults, data.pageToken);
});

export const getUserByUid = functions.region('europe-west1').https.onCall(async (uid: string, context) => {
  const isAdmin = await userIsAdmin(context.auth.uid);

  if (!isAdmin) {
    throw Error(`User is not admin. UID: ${context.auth.uid}`);
  }

  return await auth.getUser(uid).catch(err => null);
});

export const updateUserTenants = functions.region('europe-west1').https.onCall(async (data: { uid: string, tenants: { [tenant: string]: string } }, context) => {
  const isAdmin = await userIsAdmin(context.auth.uid);

  if (!isAdmin) {
    throw Error(`User is not admin. UID: ${context.auth.uid}`);
  }

  const user = await auth.getUser(data.uid);

  const newClaims = Object.assign(user.customClaims || {}, { tenants: data.tenants });

  return await auth.setCustomUserClaims(data.uid, newClaims);
});
