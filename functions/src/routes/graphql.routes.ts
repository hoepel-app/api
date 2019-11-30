import { firebaseIsAdminMiddleware } from "../middleware/has-permission.middleware";
import { Router } from 'express';
import { UserService } from "../services/user.service";
import * as admin from "firebase-admin";
import { firebaseIsAuthenticatedMiddleware } from "../middleware/is-authenticated.middleware";
import { asyncMiddleware } from '../util/async-middleware';
import { buildSchema, GraphQLSchema } from 'graphql';
import { IResolvers } from 'graphql-tools';
import * as graphqlHTTP from 'express-graphql';

const db = admin.firestore();
const auth = admin.auth();
const userService = new UserService(db, auth);

export const router = Router();

const schema: GraphQLSchema = buildSchema(`
  type User {
    uid: ID!

  }

  type Query {
    me: User
  }

  type Mutation {
    acceptPrivacyPolicy(): User!
    acceptTermsAndConditions(): User!
    changeDisplayName(name: String!): User!
  }
`);

const rootValue: IResolvers = {
  Query: {
    me: (obj, args, context, info) => {
      console.log(obj)
      console.log(args)
      console.log(context)
      console.log(info)
      return { uid: 'example' };
    },
  }
};

router.use('/', graphqlHTTP({
  schema,
  rootValue,
  graphiql: true
}));
