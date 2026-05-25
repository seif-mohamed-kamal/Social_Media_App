import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { postGQLSchema } from "../post";
import { userGQLSchema } from "../user/gql/user.schema";

const query = new GraphQLObjectType({
  name: "RootQueryType",

  description: "optional text to enhance understand api",

  fields: {
    ...userGQLSchema.registerQuery(),
    ...postGQLSchema.registerQuery(),
  },
});

const mutation = new GraphQLObjectType({
  name: "RootmutationType",

  description: "optional text to enhance understand api",

  fields: {
    ...userGQLSchema.registerMutation(),
    ...postGQLSchema.registerMutation(),
  },
});

export const schema = new GraphQLSchema({
  query,
  mutation,
});