import * as functions from 'firebase-functions';

const admin = require('firebase-admin');

// Init firebase app
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
db.settings({timestampsInSnapshots: true});

export * from './child-attendances';
export * from './crew-attendances';
export * from './user-create';
export * from './file-creation';
export * from './auth';
export * from './templates';
