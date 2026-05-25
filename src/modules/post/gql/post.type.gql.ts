import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLID,
  GraphQLList,
  GraphQLEnumType,
} from "graphql";
import { OneUserType } from "../../user/gql/user.types.gql";
import { AvailabilityEnum, ReactionEnum } from "../../../common/enum";

export const reactionGQLEnumType = new GraphQLEnumType({
  name: "ReactionGQLEnumType",
  values: {
    LIKE: { value: ReactionEnum.LIKE },
    LOVE: { value: ReactionEnum.LOVE },
    SAD: { value: ReactionEnum.SAD },
    ANGRY: { value: ReactionEnum.ANGRY },
  },
});

export const reactionGQLType = new GraphQLObjectType({
  name: "ReactionTypeResponse",
  fields: {
    userId: { type: new GraphQLNonNull(GraphQLID) },
    react: { type: reactionGQLEnumType },
  },
});

export const AvailabilityGQLEnumType = new GraphQLEnumType({
  name: "AvailabilityGQLEnumType",
  values: {
    PUBLIC: { value: AvailabilityEnum.PUBLIC },
    PRIVATE: { value: AvailabilityEnum.PRIVATE },
    ONLY_ME: { value: AvailabilityEnum.ONLY_ME },
  },
});

export const onePostType = new GraphQLObjectType({
  name: "onepostType",
  fields: {
    _id: { type: new GraphQLNonNull(GraphQLID) },
    folderId: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: GraphQLString },
    attachments: { type: new GraphQLList(GraphQLString) },
    tags: { type: new GraphQLList(OneUserType) },
    createdBy: { type: new GraphQLNonNull(OneUserType) },
    updatedBy: { type: OneUserType },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
    updatedAt: { type: GraphQLString },
    deletedAt: { type: GraphQLString },
    restoredAt: { type: GraphQLString },
    availability: { type: AvailabilityGQLEnumType },
    reactions: { type: new GraphQLList(reactionGQLType) },
  },
});

// export const PostPaginationResponse = new GraphQLObjectType({
//   name: "PostPaginationResponse",
//   fields: {
//     docs: { type: new GraphQLList(onePostType) },
//     currentPage: { type: GraphQLString },
//     pages: { type: GraphQLString },
//     size: { type: GraphQLString },
//   },
// });

export const postList = new GraphQLObjectType({
  name: "PostListResponse",

  fields: {
    message: {
      type: new GraphQLNonNull(GraphQLString),
    },

    data: {
      type: new GraphQLObjectType({
        name: "PostPaginateResponse",
        fields: {
          docs: { type: new GraphQLList(onePostType) },
          currentPage: { type: GraphQLString },
          pages: { type: GraphQLString },
          size: { type: GraphQLString },
        },
      }),
    },
  },
});

export const reactOnPost = new GraphQLObjectType({
  name: "ReactOnPostResponse",
  fields: {
    message: {
      type: new GraphQLNonNull(GraphQLString),
    },
    data: { type: onePostType },
  },
});