import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";

// Init firebase app
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
db.settings({timestampsInSnapshots: true});

export * from './firestore-events/';
export * from './user-events/';

// TODO these need to be moved to api function
export * from './file-creation';
export * from './templates';
export * from './template-fill-in';

export * from './api';
