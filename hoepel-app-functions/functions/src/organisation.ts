import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import {nodemailerMailgun} from "./services/mailgun";
import {Tenant} from "@hoepel.app/types";

const db = admin.firestore();
const auth = admin.auth();

export const tenantListMembers = functions
  .region('europe-west1')
  .https.onCall(async (data: { tenant: string }, context) => {
    const uid = context.auth.uid;

    const permissionsDoc = await db.collection('users').doc(uid).collection('tenants').doc(data.tenant).get();

    if (!permissionsDoc.exists || !permissionsDoc.data().permissions.includes('tenant:list-members')) {
      throw new Error(`User has no permission to list all users. uid=${uid}, tenant=${data.tenant}.`);
    }

    const allUsers = await db.collection('users').get();

    const members: ReadonlyArray<{ belongsToTenant: boolean, user: any, permissions: ReadonlyArray<string> }> = await Promise.all(
      allUsers.docs.map(userDoc => userDoc.ref.collection('tenants').doc(data.tenant).get().then(tenantDoc => {
        return {
          belongsToTenant: tenantDoc.exists,
          user: { ...userDoc.data(), uid: userDoc.id },
          permissions: tenantDoc.exists && tenantDoc.data() && tenantDoc.data().permissions as string[] ? tenantDoc.data().permissions : [],
        };
      }))
    );

    return members.filter(member => member.belongsToTenant);
  });

export const getAllPossibleUsersForTenant = functions
  .region('europe-west1')
  .https.onCall(async (data: { tenant: string }, context) => {
    const uid = context.auth.uid;

    const permissionsDoc = await db.collection('users').doc(uid).collection('tenants').doc(data.tenant).get();

    if (!permissionsDoc.exists || !permissionsDoc.data().permissions.includes('tenant:add-member')) {
      return {status: 'error', error: 'No permissions for tenant ' + data.tenant};
    }

    return (await db.collection('users').get()).docs.map(user => ({ ...user.data(), uid: user.id }));
  });

export const addUserToTenant = functions
  .region('europe-west1')
  .https.onCall(async (data: { tenant: string, uid: string }, context) => {
    const uid = context.auth.uid;

    const permissionsDoc = await db.collection('users').doc(uid).collection('tenants').doc(data.tenant).get();

    if (!permissionsDoc.exists || !permissionsDoc.data().permissions.includes('tenant:add-member')) {
      throw new Error(`User has no permission to add member for tenant. uid=${uid}, tenant=${data.tenant}, tried to add uid=${data.uid}`);
    }

    // Get all current permissions - new users starts with all permissions for now
    const permissions = (await db.collection('application').doc('all-permissions').get()).data().permissions;

    // Insert current tenant in tenants subcollection of this user with set permissions
    await db.collection('users').doc(data.uid).collection('tenants').doc(data.tenant).set({
      permissions,
    });

    // Add tenant name to the user's auth claims
    const user = await auth.getUser(data.uid);
    const tenants = (user.customClaims && (user.customClaims as any).tenants) ? (user.customClaims as any).tenants : {};
    tenants[data.tenant] = true;
    const newClaims = { ...(user.customClaims || {}), tenants: tenants };
    await auth.setCustomUserClaims(data.uid, newClaims);

    return { status: 'ok' };
  });

export const removeUserFromTenant = functions
  .region('europe-west1')
  .https.onCall(async (data: { tenant: string, uid: string }, context) => {
    const uid = context.auth.uid;

    // Allow users to delete tenants from themselves
    const isDeleteTenantFromSelf = data.uid === uid;

    const permissionsDoc = await db.collection('users').doc(uid).collection('tenants').doc(data.tenant).get();

    if (!isDeleteTenantFromSelf && (!permissionsDoc.exists || !permissionsDoc.data().permissions.includes('tenant:remove-member'))) {
      throw new Error(`User has no permission to remove member from tenant. uid=${uid}, tenant=${data.tenant}, tried to add uid=${data.uid}`);
    }

    // Remove current tenant name in  tenants subcollection of this user
    await db.collection('users').doc(data.uid).collection('tenants').doc(data.tenant).delete();

    // Remove tenant name from the user's auth claims
    const user = await auth.getUser(data.uid);
    const tenants = (user.customClaims && (user.customClaims as any).tenants) ? (user.customClaims as any).tenants : {};
    delete tenants[data.tenant];
    const newClaims = { ...(user.customClaims || {}), tenants: tenants };
    await auth.setCustomUserClaims(data.uid, newClaims);

    return { status: 'ok' };
  });

export const requestCreateNewTenant = functions
  .region('europe-west1')
  .https.onCall(async (data: { tenant: Tenant }, context) => {

    await nodemailerMailgun.sendMail({
      from: 'noreply@mail.hoepel.app',
      to: 'thomas@toye.io',
      subject: `Nieuwe organisatie geregistreerd: ${data.tenant.name}`,
      replyTo: 'help@hoepel.app',
      text: `Een nieuwe organisatie heeft zich geregistreerd. Naam: ${data.tenant.name}, contact: ${data.tenant.contactPerson.name}. Details als bijlage.`,
      attachments: [ {
        content: JSON.stringify(data, null, 2),
        filename: 'new-tenant-details.txt',
      }, {
        content: JSON.stringify(context.auth, null, 2),
        filename: 'user-details.txt',
      } ],
    });

    return {};
  });
