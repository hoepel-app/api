import * as functions from 'firebase-functions';

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

export const onUserCreate = functions.region('europe-west1').auth.user().onCreate((user) => {
  // Create new record in users collection with UID of user and roles for tenants
  // ...

  console.log('New user created!', user);
});
