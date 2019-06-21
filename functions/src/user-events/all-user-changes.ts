import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
import { IEvent } from '@hoepel.app/types';
import UserRecord = admin.auth.UserRecord;

const db = admin.firestore();

export const onUserCreatedSaveEvent = functions.region('europe-west1').auth.user().onCreate(async (user, context) => {
  const event: IEvent<UserRecord> = {
    timestamp: new Date(context.timestamp).getTime(),
    type: 'created',
    resource: 'auth',
    name: 'auth-user-created',
    context: {
      uid: user.uid,
      tenant: 'global',
    },
    auth: {
      userRecord: user,
    },
  };

  await db.collection('events').add(event);
});

export const onUserDeletedSaveEvent = functions.region('europe-west1').auth.user().onDelete(async (user, context) => {
  const event: IEvent<UserRecord> = {
    timestamp: new Date(context.timestamp).getTime(),
    type: 'deleted',
    resource: 'auth',
    name: 'auth-user-deleted',
    context: {
      uid: user.uid,
      tenant: 'global',
    },
    auth: {
      userRecord: user,
    },
  };

  await db.collection('events').add(event);
});
