import * as functions from 'firebase-functions';
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
db.settings({ timestampsInSnapshots: true });


export const onChildAttendanceCreate = functions.firestore.document('child-attendances-add/{docId}').onCreate(async (snap, context) => {
  const value = snap.data();

  const childId = value.childId;
  const shiftId = value.shiftId;
  const tenant  = value.tenant;
  const details = value.doc;

  await db.collection('child-attendances-by-shift').doc(shiftId).get().then(doc => {
    if (doc.exists) {
      if (doc.data().tenant === tenant) {
        const update = {};
        update['attendances.' + childId] = details;
        db.collection('child-attendances-by-shift').doc(shiftId).update(update);
      } else {
        console.error('Tried to update a child attendance document belonging to a different tenant! Existing doc: ' + JSON.stringify(doc.data()) + ', update doc: ' + JSON.stringify(value));
      }
    } else {
      const byShift = {};
      byShift[childId] = details;

      db.collection('child-attendances-by-shift').doc(shiftId).set( { tenant, attendances: byShift } );
    }
  });

  await db.collection('child-attendances-by-child').doc(childId).get().then(doc => {
    if (doc.exists) {
      if (doc.data().tenant === tenant) {
        const update = {};
        update['attendances.' + shiftId] = details;
        db.collection('child-attendances-by-child').doc(childId).update(update);
      } else {
        console.error('Tried to update a child attendance document belonging to a different tenant! Existing doc: ' + JSON.stringify(doc.data()) + ', update doc: ' + JSON.stringify(value));
      }
    } else {
      const byChild = {};
      byChild[shiftId] = details;

      db.collection('child-attendances-by-child').doc(childId).set( { tenant, attendances: byChild } );
    }
  });

  await db.collection('child-attendances-add').doc(context.params.docId).delete();  


  return true;
});

export const onChildAttendanceDelete = functions.firestore.document('child-attendances-delete/{docId}').onCreate(async (snap, context) => {
  const value = snap.data();

  const childId = value.childId;
  const shiftId = value.shiftId;
  const tenant  = value.tenant;

  await db.collection('child-attendances-by-shift').doc(shiftId).get().then(doc => {
    if (doc.exists) {
      if (doc.data().tenant === tenant) {
        const update = doc.data();
        delete update.attendances[childId];
        db.collection('child-attendances-by-shift').doc(shiftId).set(update);
      } else {
        console.error('Tried to update a child attendance document belonging to a different tenant! Existing doc: ' + JSON.stringify(doc.data()) + ', delete doc: ' + JSON.stringify(value));
      }
    } else {
      console.error('Tried to delete a non-existant child attendance. Delete document: ' + JSON.stringify(value));
    }
  });

  await db.collection('child-attendances-by-child').doc(childId).get().then(doc => {
    if (doc.exists) {
      if (doc.data().tenant === tenant) {
        const update = doc.data();
        delete update.attendances[shiftId];
        db.collection('child-attendances-by-child').doc(childId).set(update);
      } else {
        console.error('Tried to set a child attendance document belonging to a different tenant! Existing doc: ' + JSON.stringify(doc.data()) + ', delete doc: ' + JSON.stringify(value));
      }
    } else {
      console.error('Tried to delete a non-existant child attendance. Delete document: ' + JSON.stringify(value));
    }
  });


  await db.collection('child-attendances-delete').doc(context.params.docId).delete();

  return true;
});


export const onCrewAttendanceCreate = functions.firestore.document('crew-attendances-add/{docId}').onCreate(async (snap, context) => {
  const value = snap.data();

  const crewId = value.crewId;
  const shiftId = value.shiftId;
  const tenant  = value.tenant;
  const details = value.doc;

  await db.collection('crew-attendances-by-shift').doc(shiftId).get().then(doc => {
    if (doc.exists) {
      if (doc.data().tenant === tenant) {
        const update = {};
        update['attendances.' + crewId] = details;
        db.collection('crew-attendances-by-shift').doc(shiftId).update(update);
      } else {
        console.error('Tried to update a crew attendance document belonging to a different tenant! Existing doc: ' + JSON.stringify(doc.data()) + ', update doc: ' + JSON.stringify(value));
      }
    } else {
      const byShift = {};
      byShift[crewId] = details;

      db.collection('crew-attendances-by-shift').doc(shiftId).set( { tenant, attendances: byShift } );
    }
  });

  await db.collection('crew-attendances-by-crew').doc(crewId).get().then(doc => {
    if (doc.exists) {
      if (doc.data().tenant === tenant) {
        const update = {};
        update['attendances.' + shiftId] = details;
        db.collection('crew-attendances-by-crew').doc(crewId).update(update);
      } else {
        console.error('Tried to update a crew attendance document belonging to a different tenant! Existing doc: ' + JSON.stringify(doc.data()) + ', update doc: ' + JSON.stringify(value));
      }
    } else {
      const byCrew = {};
      byCrew[shiftId] = details;

      db.collection('crew-attendances-by-crew').doc(crewId).set( { tenant, attendances: byCrew } );
    }
  });

  await db.collection('crew-attendances-add').doc(context.params.docId).delete();


  return true;
});


export const onCrewAttendanceDelete = functions.firestore.document('crew-attendances-delete/{docId}').onCreate(async (snap, context) => {
  const value = snap.data();

  const crewId = value.crewId;
  const shiftId = value.shiftId;
  const tenant  = value.tenant;

  await db.collection('crew-attendances-by-shift').doc(shiftId).get().then(doc => {
    if (doc.exists) {
      if (doc.data().tenant === tenant) {
        const update = doc.data();
        delete update.attendances[crewId];
        db.collection('crew-attendances-by-shift').doc(shiftId).set(update);
      } else {
        console.error('Tried to update a crew attendance document belonging to a different tenant! Existing doc: ' + JSON.stringify(doc.data()) + ', delete doc: ' + JSON.stringify(value));
      }
    } else {
      console.error('Tried to delete a non-existant crew attendance. Delete document: ' + JSON.stringify(value));
    }
  });

  await db.collection('crew-attendances-by-crew').doc(crewId).get().then(doc => {
    if (doc.exists) {
      if (doc.data().tenant === tenant) {
        const update = doc.data();
        delete update.attendances[shiftId];
        db.collection('crew-attendances-by-crew').doc(crewId).set(update);
      } else {
        console.error('Tried to set a crew attendance document belonging to a different tenant! Existing doc: ' + JSON.stringify(doc.data()) + ', delete doc: ' + JSON.stringify(value));
      }
    } else {
      console.error('Tried to delete a non-existant crew attendance. Delete document: ' + JSON.stringify(value));
    }
  });


  await db.collection('crew-attendances-delete').doc(context.params.docId).delete();

  return true;
});



/*

Example user object:

{ email: 'thomas@toye.io',
  emailVerified: false,
  displayName: 'Thomas Toye',
  photoURL: 'https://graph.facebook.com/11111111111111/picture',
  phoneNumber: null,
  disabled: false,
  providerData:
   [ { displayName: 'Thomas Toye',
       email: 'thomas@toye.io',
       photoURL: 'https://graph.facebook.com/1111111111111/picture',
       providerId: 'facebook.com',
       uid: '1111111111111111111',
       toJSON: [Function] } ],
  customClaims: {},
  passwordSalt: null,
  passwordHash: null,
  tokensValidAfterTime: null,
  metadata:
   UserRecordMetadata {
     creationTime: '2018-10-18T09:37:32Z',
     lastSignInTime: '2018-10-18T09:37:32Z' },
  uid: 'vAK0raaaaaaaaaaaaaaaaaaaa',
  toJSON: [Function] }



  ==> is an UserRecord?
  
  https://firebase.google.com/docs/reference/functions/functions.auth.UserRecord

*/

export const onUserCreate = functions.auth.user().onCreate((user) => {
  // Create new record in users collection with UID of user and roles for tenants
  // ...

  console.log('New user created!', user);
});



