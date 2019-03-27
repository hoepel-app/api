import { Request, Response, NextFunction, RequestHandler } from "express";
import * as admin from "firebase-admin";

/**
 * Middleware to check if a user has the required permission
 *
 * @param db Firebase admin Firestore (e.g. admin.firestore())
 * @param permissionNeeded The needed permission. If null,
 * @param allowAdmin If true, allow admin to access this route even if permission is missing
 */
export const firebaseHasPermissionMiddleware = (db: admin.firestore.Firestore, permissionNeeded: string, allowAdmin = true): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uid  = res.locals.user.uid;
    const isAdmin = !!res.locals.user.isAdmin;
    const tenant = req.params.tenant;

    if (!uid) {
      res.status(401).send({ error: 'No uid found' });
      return;
    }

    // Allow admin to access this resource
    if(isAdmin && allowAdmin) {
      next();
      return;
    }

    if (!tenant) {
      res.status(500).send({ error: 'No tenant set and not admin or admin not allowed' });
      console.error(`No tenant found in request for user ${uid}, isAdmin=${isAdmin}, allowAdmin=${allowAdmin}`);
      return;
    }

    db.collection('users').doc(uid).collection('tenants').doc(tenant).get().then(permissionsDoc => {

      if (!permissionNeeded ||
        !permissionsDoc.exists ||
        !permissionsDoc.data() ||
        !permissionsDoc.data().permissions ||
        !permissionsDoc.data().permissions.includes(permissionNeeded))
      {
        res.status(401).send({
          error: 'No permission to access this resource',
          permissionsDocExists: permissionsDoc.exists,
          permissionNeeded: permissionNeeded,
          permissions: (permissionsDoc.data() || {}).permissions,
          tenant,
        });
      } else {
        next();
      }

    }).catch(err => {
      res.status(500).send({ error: 'Unexpected error checking permission' });
      console.error(`Error while getting permission doc for user with uid ${uid} for tenant ${tenant}`, err);
    });
  }
};

/**
 * Middleware that only allows access for admin users
 *
 * @param db Firebase admin Firestore (e.g. admin.firestore())
 */
export const firebaseIsAdminMiddleware = (db: admin.firestore.Firestore) => firebaseHasPermissionMiddleware(db, null, true);
