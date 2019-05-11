import * as admin from "firebase-admin";
import { Router } from "express";
import { firebaseIsAuthenticatedMiddleware } from "../middleware/is-authenticated.middleware";
import { firebaseHasPermissionMiddleware } from "../middleware/has-permission.middleware";
import { TemplateService } from '../services/template.service';

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage().bucket('hoepel-app-templates');
const templateService = new TemplateService(db, storage);

export const router = Router();

router.use(firebaseIsAuthenticatedMiddleware(admin));

router.post('/:templateId/test', firebaseHasPermissionMiddleware(db, 'template:read'), async (req, res, next) => {
  try {
    const templateResult = await templateService.testTemplate(
      res.locals.tenant,
      req.params.templateId,
      res.locals.user.name || res.locals.user.email,
      res.locals.user.uid,
    );
    res.json(templateResult);
  } catch (err) {
    console.error(`Could not test template ${req.params.templateId} (requested by ${res.locals.user.uid})`, err);
    res.status(500).json({ error: 'Could not test template' });
  }
});

router.delete('/:templateId', firebaseHasPermissionMiddleware(db, 'template:write'), async (req, res, next) => {
  try {
    const templateResult = await templateService.testTemplate(
      res.locals.tenant,
      req.params.templateId,
      res.locals.user.name || res.locals.user.email,
      res.locals.user.uid,
    );
    res.json(templateResult);
  } catch (err) {
    console.error(`Could not test template ${req.params.templateId} (requested by ${res.locals.user.uid})`, err);
    res.status(500).json({ error: 'Could not test template' });
  }
});
