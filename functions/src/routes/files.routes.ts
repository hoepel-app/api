import * as admin from "firebase-admin";
import { Router } from "express";
import { firebaseIsAuthenticatedMiddleware } from "../middleware/is-authenticated.middleware";
import { firebaseHasPermissionMiddleware } from "../middleware/has-permission.middleware";
import { FileService } from '../services/file.service';
import { FileRequestMetadata, FileType } from '@hoepel.app/types';
import { asyncMiddleware } from '../util/async-middleware';
import { createChildRepository } from '../services/child.service';
import { createCrewRepository } from '../services/crew.service';
import { createShiftRepository, ShiftService } from '../services/shift.service';
import { createContactPersonRepository } from '../services/contact-person.service';
import {
  ChildAttendanceService,
  createChildAttendanceByChildRepository,
  createChildAttendanceByShiftRepository,
} from '../services/child-attendance.service';
import {
  createCrewAttendanceByCrewRepository,
  createCrewAttendanceByShiftRepository, CrewAttendanceService,
} from '../services/crew-attendance.service';
import { XlsxExporter } from '../services/exporters/exporter';

const db = admin.firestore();
const storage = admin.storage().bucket('hoepel-app-reports');
const xlsxExporter = new XlsxExporter();
const childRepository = createChildRepository(db);
const crewRepository = createCrewRepository(db);
const shiftService = new ShiftService(createShiftRepository(db));
const contactPersonRepository = createContactPersonRepository(db);

const childAttendanceService = new ChildAttendanceService(
  createChildAttendanceByChildRepository(db),
  createChildAttendanceByShiftRepository(db),
);

const crewAttendanceService = new CrewAttendanceService(
  createCrewAttendanceByCrewRepository(db),
  createCrewAttendanceByShiftRepository(db),
);

const fileService = new FileService(xlsxExporter, childRepository, crewRepository, contactPersonRepository, shiftService, childAttendanceService, crewAttendanceService, db, storage);

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
      case 'children-per-day':
        return res.json(await fileService.exportChildrenPerDay(tenant, createdBy, uid, metadata.year || new Date().getFullYear()));
      default:
        return res.status(400).json({ error: `No supported exporter found for type ${type}` });
    }
  })
);
