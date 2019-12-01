import { Router } from 'express';
import { UserService } from "../services/user.service";
import * as admin from "firebase-admin";
import { IResolvers, makeExecutableSchema, ITypeDefinitions } from 'graphql-tools';
import expressPlayground from 'graphql-playground-middleware-express';
import * as graphqlHTTP from 'express-graphql';
import { IncomingMessage } from 'http';
import { Permission } from '@hoepel.app/types';
import { NoPermissionError } from '../errors/no-permission.error';
import { FileService } from '../services/file.service';
import { XlsxExporter } from '../services/exporters/xlsx-exporter';
import { createChildRepository } from '../services/child.service';
import { createCrewRepository } from '../services/crew.service';
import { createContactPersonRepository } from '../services/contact-person.service';
import { ShiftService, createShiftRepository } from '../services/shift.service';
import { ChildAttendanceService, createChildAttendanceByChildRepository, createChildAttendanceByShiftRepository } from '../services/child-attendance.service';
import { createCrewAttendanceByCrewRepository, createCrewAttendanceByShiftRepository, CrewAttendanceService } from '../services/crew-attendance.service';

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage().bucket('hoepel-app-reports');;

const userService = new UserService(db, auth);
const childRepository = createChildRepository(db);
const crewRepository = createCrewRepository(db);
const contactPersonRepository = createContactPersonRepository(db);
const shiftRepository = createShiftRepository(db);
const childAttendanceByChildRepository = createChildAttendanceByChildRepository(db);
const childAttendanceByShiftRepository = createChildAttendanceByShiftRepository(db);
const crewAttendanceByCrewRepository = createCrewAttendanceByCrewRepository(db);
const crewAttendanceByShiftRepository = createCrewAttendanceByShiftRepository(db);
const shiftService = new ShiftService(shiftRepository);
const childAttendanceService = new ChildAttendanceService(childAttendanceByChildRepository, childAttendanceByShiftRepository);
const crewAttendanceService = new CrewAttendanceService(crewAttendanceByCrewRepository, crewAttendanceByShiftRepository);
const fileService = new FileService(new XlsxExporter(), childRepository, crewRepository, contactPersonRepository, shiftService, childAttendanceService, crewAttendanceService, db, storage);

const parseToken = async (authorizationHeader: string): Promise<admin.auth.DecodedIdToken> => {
  // tslint:disable-next-line: triple-equals
  if (authorizationHeader == null || authorizationHeader.split(' ')[1] == null) {
    throw new Error('Authorization is missing or invalid')
  }

  return await admin.auth().verifyIdToken(authorizationHeader.split(' ')[1])
};

const assertHasPermissions = async (uid: string, tenant: string, permission: Permission): Promise<void> => {
  console.log(`Checking if ${uid} has permission ${permission}`)

  if (!uid) {
    throw new NoPermissionError('Uid not set');
  }

  try {
    const permissionsDoc = await db.collection('users').doc(uid).collection('tenants').doc(tenant).get();

    if (!permissionsDoc.exists || !permissionsDoc?.data()?.permissions?.includes(permission)) {
      throw new NoPermissionError(`No permission to access this resource (need ${permission} for tenant ${tenant})`, {
        permissionsDocExists: permissionsDoc.exists,
        permissionNeeded: permission,
        permissions: permissionsDoc.data()?.permissions,
        tenant,
      });
    }
  } catch (err) {
    if (err instanceof NoPermissionError) {
      throw err; // re-throw local error
    } else {
      throw new NoPermissionError('Unexpected error checking permission', { tenant }, err);
    }
  }
}

export const router = Router();

const typeDefs: ITypeDefinitions = `
  enum ReportType {
    ALL_CHILDREN
    ALL_CREW
    CHILDREN_WITH_COMMENT
    CREW_ATTENDANCES
    CHILD_ATTENDANCES
    FISCAL_CERTIFICATES_LIST
    CHILDREN_PER_DAY
  }

  enum ReportFileFormat {
    XLSX
    PDF
    DOCX
  }

  type Report {
    id: ID!
    refPath: String!
    description: String!
    expires: String!
    created: String!
    format: ReportFileFormat!
    createdBy: String
    createdByUid: String!
    type: ReportType!
  }

  type UserToken {
    picture: String
    isAdmin: Boolean!
    tenants: [String!]!
    iss: String!
    aud: String!
    authTime: String!
    sub: String!
    uid: String!
    iat: Int!
    exp: Int!
    email: String!
    emailVerified: String!
  }

  type User {
    id: ID!
    token: UserToken
    displayName: String
    acceptedPrivacyPolicy: String
    acceptedTermsAndConditions: String
    email: String!
  }

  type Query {
    me: User
  }

  type Mutation {
    acceptPrivacyPolicy: User
    acceptTermsAndConditions: User
    changeDisplayName(name: String!): User

    deleteReport(tenant: ID!, fileName: String!): Report
    createReport(tenant: ID!, type: ReportType!, format: ReportFileFormat!, year: Int): Report!
  }

  schema {
    query: Query
    mutation: Mutation
  }
`;

const resolvers: IResolvers = {
  Mutation: {
    acceptPrivacyPolicy: async (obj, args, context: IncomingMessage, info) => {
      const user = await parseToken(context.headers.authorization)
      await userService.acceptPrivacyPolicy(user.uid)
    },
    acceptTermsAndConditions: async (obj, args, context: IncomingMessage, info) => {
      const user = await parseToken(context.headers.authorization)
      await userService.acceptTermsAndConditions(user.uid)
    },
    changeDisplayName: async (obj, { name }: { name: string }, context: IncomingMessage, info) => {
      const user = await parseToken(context.headers.authorization)
      await userService.updateDisplayName(user.uid, name)
    },
    deleteReport: async (obj, { tenant, fileName }: { tenant: string, fileName: string }, context: IncomingMessage, info) => {
      const user = await parseToken(context.headers.authorization)
      await assertHasPermissions(user.uid, tenant, Permission.ReportsDelete)
      await fileService.removeFile(tenant, user.uid, fileName)
    },
    createReport: async (obj, { tenant, type, format, year }: { tenant: string, type: string, format: string, year: number }, context: IncomingMessage, info) => {
      const user = await parseToken(context.headers.authorization)
      await assertHasPermissions(user.uid, tenant, Permission.ReportsRequest)

      const createdBy = user.name || user.email || '';
      const reportYear = year || new Date().getFullYear()

      if (format !== 'XLSX') {
        throw new Error('Only XLSX is supported as format')
      }

      switch(type) {
        case 'all-children':
          return await fileService.exportAllChildren(tenant, createdBy, user.uid);
        case 'all-crew':
          return await fileService.exportAllCrew(tenant, createdBy, user.uid);
        case 'children-with-comment':
          return await fileService.exportChildrenWithComment(tenant, createdBy, user.uid);
        case 'crew-attendances':
          return await fileService.exportCrewAttendances(tenant, createdBy, user.uid, reportYear);
        case 'child-attendances':
          return await fileService.exportChildAttendances(tenant, createdBy, user.uid, reportYear);
        case 'fiscal-certificates-list':
          return await fileService.exportFiscalCertificatesList(tenant, createdBy, user.uid, reportYear);
        case 'children-per-day':
          return await fileService.exportChildrenPerDay(tenant, createdBy, user.uid, reportYear);
        default:
          throw new Error(`No exporter found for ${type}`)
      }
    },
  },
  Query: {
    me: async (obj, args, context: IncomingMessage, info) => {
      const { uid } = await parseToken(context.headers.authorization)
      const user = await userService.getUserFromDb(uid)

      return {
        id: uid,
        displayName: user?.displayName,
        acceptedPrivacyPolicy: user?.acceptedPrivacyPolicy?.getTime().toString(),
        acceptedTermsAndConditions: user?.acceptedTermsAndConditions?.getTime().toString(),
        email: user?.email,
      }
    }
  },
  ReportType: {
    ALL_CHILDREN: 'all-children',
    ALL_CREW: 'all-crew',
    CHILDREN_WITH_COMMENT: 'children-with-comment',
    CREW_ATTENDANCES: 'crew-attendances',
    CHILD_ATTENDANCES: 'child-attendances',
    FISCAL_CERTIFICATES_LIST: 'fiscal-certificates-list',
    CHILDREN_PER_DAY: 'children-per-day'
  },
  User: {
    token: async (obj, args, context: IncomingMessage, info) => {
      const user = await parseToken(context.headers.authorization)

      return {
        picture: user.picture,
        isAdmin: user.isAdmin || false,
        tenants: Object.keys(user.tenants || {}),
        email: user.email,
        emailVerified: user.email_verified,
        iss: user.iss,
        aud: user.aud,
        authTime: user.auth_time,
        sub: user.sub,
        uid: user.uid,
        iat: user.iat,
        exp: user.exp
      }
    }
  }
};

router.use('/playground', expressPlayground({
  endpoint: '/api/graphql'
}));

router.use('/', graphqlHTTP({
  schema: makeExecutableSchema({
    resolvers,
    typeDefs,
    allowUndefinedInResolve: false
  }),
  graphiql: false
}));
