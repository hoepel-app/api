import * as functions from "firebase-functions";
import { getParentUidFromJwt, verifyJwt } from "./verify-jwt";
import { Child, IChild } from "@hoepel.app/types";
import * as admin from "firebase-admin";
import { DocumentSnapshot } from "firebase-functions/lib/providers/firestore";

const db = admin.firestore();

export const childrenManagedByParent = functions
  .region('europe-west1')
  .https.onCall(async (data: { token: string, organisationId: string }, context) => {

    if (!verifyJwt(data.token)) {
      throw new Error('Invalid authentication');
    }

    const parentUid = getParentUidFromJwt(data.token);

    const children: ReadonlyArray<Child> = (await db.collection('children')
        .where('managedByParents', 'array-contains', parentUid)
        .where('tenant', '==', data.organisationId)
        .get()
    ).docs.map(snapshot => new Child({ ...snapshot.data() as IChild, id: snapshot.id }));

    return children;
  });

export const updateChildByParent = functions
  .region('europe-west1')
  .https.onCall(async (data: { token: string, organisationId: string, childId: string, child: Child }, context) => {

    if (!verifyJwt(data.token)) {
      throw new Error('Invalid authentication');
    }

    const parentUid = getParentUidFromJwt(data.token);

    const snapshot: DocumentSnapshot = (await db.collection('children').doc(data.childId).get());

    if (!snapshot.exists) {
      throw new Error('Child not found');
    } else if (snapshot.data().tenant !== data.organisationId) {
      throw new Error(`Tenant id on child (${snapshot.data().tenant}) does not match given tenant id (${data.organisationId})`);
    } else if ((snapshot.data().managedByParents || [] as ReadonlyArray<string>).indexOf(parentUid) === -1) {
      throw new Error(`Parent can not edit child since parent uid (${parentUid}) is not included in ${JSON.stringify(snapshot.data().managedByParents)}`);
    }

    // First, create a new child object. This way, only valid properties are kept
    // Then stringify and parse as JSON. We get a plain JS object
    // Finally, drop the id
    const { id, ...newChild } = JSON.parse(JSON.stringify(new Child(data.child)));
    const newChildWithTenant = { ...newChild, tenant: data.organisationId };

    return await db.collection('children').doc(data.childId).set(newChildWithTenant);
  });


export const createChildByParent = functions
  .region('europe-west1')
  .https.onCall(async (data: { token: string, organisationId: string, child: Child }, context) => {

    if (!verifyJwt(data.token)) {
      throw new Error('Invalid authentication');
    }

    const parentUid = getParentUidFromJwt(data.token);

    // First, create a new child object. This way, only valid properties are kept
    // Then stringify and parse as JSON. We get a plain JS object
    // Finally, drop the id
    const { id, ...newChild } = JSON.parse(JSON.stringify(new Child(data.child).withManagedByParents([ parentUid ])));
    const newChildWithTenant = { ...newChild, tenant: data.organisationId };

    return await db.collection('children').add(newChildWithTenant);
  });
