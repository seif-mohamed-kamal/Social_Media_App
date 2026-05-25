import { GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import { reactionGQLEnumType } from "./post.type.gql";

export const postList = {
  page: { type: GraphQLInt },
  size: { type: GraphQLInt },
  search: { type: GraphQLString },
};

export const reactOnPost = {
  postId: {
    type: new GraphQLNonNull(GraphQLID),
  },

  react: {
    type: new GraphQLNonNull(reactionGQLEnumType),
  },
};