import { Router } from 'express';
import { UserService } from "../services/user.service";
import * as admin from "firebase-admin";
import { IResolvers, makeExecutableSchema, ITypeDefinitions } from 'graphql-tools';
import expressPlayground from 'graphql-playground-middleware-express';
import * as graphqlHTTP from 'express-graphql';
import { IncomingMessage } from 'http';

const db = admin.firestore();
const auth = admin.auth();
const userService = new UserService(db, auth);

const parseToken = async (authorizationHeader: string): Promise<admin.auth.DecodedIdToken> => {
  // tslint:disable-next-line: triple-equals
  if (authorizationHeader == null || authorizationHeader.split(' ')[1] == null) {
    throw new Error('Authorization is missing or invalid')
  }

  return await admin.auth().verifyIdToken(authorizationHeader.split(' ')[1])
};

export const router = Router();

const typeDefs: ITypeDefinitions = `
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
    }
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
