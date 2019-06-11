import * as admin from "firebase-admin";
import { Router } from "express";
import { firebaseIsAuthenticatedMiddleware } from "../middleware/is-authenticated.middleware";
import { firebaseHasPermissionMiddleware } from "../middleware/has-permission.middleware";
import { FileService } from '../services/file.service';
import { FileRequestMetadata, FileType } from '@hoepel.app/types';
import { asyncMiddleware } from '../util/async-middleware';
import { ChildService } from "../services/child.service";
import { CrewService } from "../services/crew.service";
import { ShiftService } from "../services/shift.service";

const db = admin.firestore();
const storage = admin.storage().bucket('hoepel-app-reports');
const childService = new ChildService(db);
const crewService = new CrewService(db);
const shiftService = new ShiftService(db);

const fileService = new FileService(childService, crewService, shiftService, db, storage);

export const router = Router();

router.use(firebaseIsAuthenticatedMiddleware(admin));

router.delete(
  '/:fileName',
  firebaseHasPermissionMiddleware(db, 'reports:delete'),
  asyncMiddleware(async (req, res) => {
    await fileService.removeFile(res.locals.tenant, res.locals.user.uid, req.params.fileName);
    res.json({});
  })
);

router.post(
  '/',
  firebaseHasPermissionMiddleware(db, 'reports:request'),
  asyncMiddleware(async (req, res) => {
    const type: FileType = req.body.type;
    const metadata: FileRequestMetadata = req.body.metadata;
    const tenant: string = res.locals.tenant;
    const uid = res.locals.user.uid;
    const createdBy = res.locals.user.name || res.locals.user.email || '';

    if (metadata.format !== 'XLSX') {
      return res.status(400).json({ error: 'Only XLSX is supported for now'});
    }

    switch(type) {
      case 'all-children':
        return res.json(await fileService.exportAllChildren(tenant, createdBy, uid));
      case 'all-crew':
        return res.json(await fileService.exportAllCrew(tenant, createdBy, uid));
      case 'children-with-comment':
        return res.json(await fileService.exportChildrenWithComment(tenant, createdBy, uid));
      case 'crew-attendances':
        return res.json(await fileService.exportCrewAttendances(tenant, createdBy, uid, metadata.year || new Date().getFullYear()));
      case 'child-attendances':
        return res.json(await fileService.exportChildAttendances(tenant, createdBy, uid, metadata.year || new Date().getFullYear()));
      case 'fiscal-certificates-list':
        return res.json(await fileService.exportFiscalCertificatesList(tenant, createdBy, uid, metadata.year || new Date().getFullYear()));
      default:
        return res.status(400).json({ error: `No supported exporter found for type ${type}` });
    }
  })
);
