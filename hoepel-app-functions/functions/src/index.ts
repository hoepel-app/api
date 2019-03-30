import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";

// Init firebase app
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
db.settings({timestampsInSnapshots: true});

export * from './child-attendances';
export * from './crew-attendances';

export * from './user-create'; // TODO move to user-lifecycle.ts
export * from './user-delete'; // TODO move to user-lifecycle.ts

export * from './file-creation';
export * from './templates';
export * from './template-fill-in';

export * from './organisation';

export * from './api';
