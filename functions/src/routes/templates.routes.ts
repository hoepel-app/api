import * as admin from 'firebase-admin';
import { Router } from 'express';
import { firebaseIsAuthenticatedMiddleware } from '../middleware/is-authenticated.middleware';
import { firebaseHasPermissionMiddleware } from '../middleware/has-permission.middleware';
import { TemplateService } from '../services/template.service';
import { createChildRepository } from '../services/child.service';
import { AddressService } from '../services/address.service';
import { OrganisationService } from '../services/organisation.service';
import {
  ChildAttendanceService,
  createChildAttendanceByChildRepository,
  createChildAttendanceByShiftRepository,
} from '../services/child-attendance.service';
import { createShiftRepository, ShiftService } from '../services/shift.service';
import { createContactPersonRepository } from '../services/contact-person.service';
import { asyncMiddleware } from '../util/async-middleware';

const db = admin.firestore();
const auth = admin.auth();
const templatesStorage = admin.storage().bucket('hoepel-app-templates');
const reportsStorage = admin.storage().bucket('hoepel-app-reports');

const contactPersonRepository = createContactPersonRepository(db);
const childRepository = createChildRepository(db);
const addressService = new AddressService(contactPersonRepository);
const organisationService = new OrganisationService(db, auth);
const childAttendanceService = new ChildAttendanceService(
  createChildAttendanceByChildRepository(db),
  createChildAttendanceByShiftRepository(db),
);
const shiftRepository = createShiftRepository(db);

const templateService = new TemplateService(
  db,
  templatesStorage,
  reportsStorage,
  childRepository,
  contactPersonRepository,
  addressService,
  organisationService,
  childAttendanceService,
  shiftRepository,
);

export const router = Router();

router.use(firebaseIsAuthenticatedMiddleware(admin));

router.post('/:templateId/test', firebaseHasPermissionMiddleware(db, 'template:read'), asyncMiddleware(async (req, res, next) => {
  const templateResult = await templateService.testTemplate(
    res.locals.tenant,
    req.params.templateId,
    res.locals.user.name || res.locals.user.email,
    res.locals.user.uid,
  );
  res.json(templateResult);
}));

router.post('/:templateId/fill-in/child/:childId/:year',
  firebaseHasPermissionMiddleware(db, 'template:read'),
  firebaseHasPermissionMiddleware(db, 'template:fill-in'),
  firebaseHasPermissionMiddleware(db, 'child:read'),
  asyncMiddleware(async (req, res, next) => {
    const savedReportDetails = await templateService.fillInChildTemplate(res.locals.tenant, {
      createdBy: res.locals.user.name || res.locals.user.email || '',
      createdByUid: res.locals.user.uid,
      childId: req.params.childId,
      templateFileName: req.params.templateId,
      year: Number(req.params.year) || new Date().getFullYear(),
    });

    res.json(savedReportDetails);
  }));

router.delete('/:templateId', firebaseHasPermissionMiddleware(db, 'template:write'), asyncMiddleware(async (req, res, next) => {
  const deletionResult = await templateService.deleteTemplate(
    res.locals.tenant,
    req.params.templateId,
  );
  res.json(deletionResult);
}));
