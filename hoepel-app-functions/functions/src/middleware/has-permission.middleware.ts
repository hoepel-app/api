import { Request, Response, NextFunction, RequestHandler } from "express";
import * as admin from "firebase-admin";

export const firebaseHasPermissionMiddleware = (db: admin.firestore.Firestore, permissionNeeded: string, allowAdmin = true): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uid  = res.locals.user.uid;
    const isAdmin = !!res.locals.user.isAdmin;
    const tenant = req.params.tenant;

    if (!uid) {
      res.status(401).send({ error: 'No uid found' });
      return;
    }

    db.collection('users').doc(uid).collection('tenants').doc(tenant).get().then(permissionsDoc => {
      // Allow admin to access this resource
      if(isAdmin && allowAdmin) {
        next();
        return;
      }

      if (!permissionsDoc.exists || !permissionsDoc.data() || !permissionsDoc.data().permissions || !permissionsDoc.data().permissions.includes(permissionNeeded)) {
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
