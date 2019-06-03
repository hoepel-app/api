import * as admin from "firebase-admin";
import { Router } from "express";
import { firebaseIsAuthenticatedMiddleware } from "../middleware/is-authenticated.middleware";
import { firebaseHasPermissionMiddleware } from "../middleware/has-permission.middleware";
import { OrganisationService } from "../services/organisation.service";

const db = admin.firestore();
const auth = admin.auth();
const organisationService = new OrganisationService(db, auth);

export const router = Router();

router.use(firebaseIsAuthenticatedMiddleware(admin));


router.post(
    '/request',
    async (req, res) => {
        try {
            console.log(`New organisation requested by ${res.locals.user.uid}: ${JSON.stringify(req.body)}`);
            await organisationService.requestCreateNewOrganisation(req.body.organisation, res.locals.user);
            res.json({});
        } catch(err) {
            console.error(`Could not request new organisation (requested by ${res.locals.user.uid})`, err);
            res.status(500).json({ error: 'Could not request creation of new organisation' })
        }
    }
);

router.delete(
    '/:tenant/members/:uid',
    firebaseHasPermissionMiddleware(db, 'tenant:remove-member'), // TODO should also allow to delete self!
    async (req, res) => {
        try {
            await organisationService.removeUserFromOrganisation(req.params.tenant, req.params.uid);
            res.json({});
        } catch(err) {
            console.error(`Could not remove user ${req.params.uid} from organisation ${req.params.tenant}`, err);
            res.status(500).json({ error: 'Could not remove user from organisation' })
        }
    }
);

router.put(
    '/:tenant/members/:uid',
    firebaseHasPermissionMiddleware(db, 'tenant:add-member'),
    async (req, res) => {
        try {
            await organisationService.addUserToOrganisation(req.params.tenant, req.params.uid);
            res.json({});
        } catch (err) {
            console.error(`Could not add user ${req.params.uid} to organisation ${req.params.tenant}`);
            res.status(500).json({ error: 'Could not add user to organisation' });
        }
    }
);

router.get(
    '/:tenant/members',
    firebaseHasPermissionMiddleware(db, 'tenant:list-members'),
    async (req, res) => {
        try {
            const members = await organisationService.listMembers(req.params.tenant);
            res.json({ data: members });
        } catch (err) {
            console.error(`Could not get all members for organisation ${req.params.tenant}`, err);
            res.status(500).json({ error: 'Could not get members for organisation' });
        }
    }
);

router.get(
    '/:tenant/possible-members',
    firebaseHasPermissionMiddleware(db, 'tenant:list-members'),
    async (req, res) => {
        try {
            const possibleMembers = await organisationService.listPossibleMembers(req.params.tenant);
            res.json({ data: possibleMembers });
        } catch (err) {
            console.error(`Could not list possible members for organisation ${req.params.tenant}`, err);
            res.status(500).json({ error: 'Could not get possible members for organisation' })
        }
    }
);
