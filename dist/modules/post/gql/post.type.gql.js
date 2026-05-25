"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactOnPost = exports.postList = exports.onePostType = exports.AvailabilityGQLEnumType = exports.reactionGQLType = exports.reactionGQLEnumType = void 0;
const graphql_1 = require("graphql");
const user_types_gql_1 = require("../../user/gql/user.types.gql");
const enum_1 = require("../../../common/enum");
exports.reactionGQLEnumType = new graphql_1.GraphQLEnumType({
    name: "ReactionGQLEnumType",
    values: {
        LIKE: { value: enum_1.ReactionEnum.LIKE },
        LOVE: { value: enum_1.ReactionEnum.LOVE },
        SAD: { value: enum_1.ReactionEnum.SAD },
        ANGRY: { value: enum_1.ReactionEnum.ANGRY },
    },
});
exports.reactionGQLType = new graphql_1.GraphQLObjectType({
    name: "ReactionTypeResponse",
    fields: {
        userId: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
        react: { type: exports.reactionGQLEnumType },
    },
});
exports.AvailabilityGQLEnumType = new graphql_1.GraphQLEnumType({
    name: "AvailabilityGQLEnumType",
    values: {
        PUBLIC: { value: enum_1.AvailabilityEnum.PUBLIC },
        PRIVATE: { value: enum_1.AvailabilityEnum.PRIVATE },
        ONLY_ME: { value: enum_1.AvailabilityEnum.ONLY_ME },
    },
});
exports.onePostType = new graphql_1.GraphQLObjectType({
    name: "onepostType",
    fields: {
        _id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
        folderId: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        content: { type: graphql_1.GraphQLString },
        attachments: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        tags: { type: new graphql_1.GraphQLList(user_types_gql_1.OneUserType) },
        createdBy: { type: new graphql_1.GraphQLNonNull(user_types_gql_1.OneUserType) },
        updatedBy: { type: user_types_gql_1.OneUserType },
        createdAt: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        updatedAt: { type: graphql_1.GraphQLString },
        deletedAt: { type: graphql_1.GraphQLString },
        restoredAt: { type: graphql_1.GraphQLString },
        availability: { type: exports.AvailabilityGQLEnumType },
        reactions: { type: new graphql_1.GraphQLList(exports.reactionGQLType) },
    },
});
exports.postList = new graphql_1.GraphQLObjectType({
    name: "PostListResponse",
    fields: {
        message: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
        },
        data: {
            type: new graphql_1.GraphQLObjectType({
                name: "PostPaginateResponse",
                fields: {
                    docs: { type: new graphql_1.GraphQLList(exports.onePostType) },
                    currentPage: { type: graphql_1.GraphQLString },
                    pages: { type: graphql_1.GraphQLString },
                    size: { type: graphql_1.GraphQLString },
                },
            }),
        },
    },
});
exports.reactOnPost = new graphql_1.GraphQLObjectType({
    name: "ReactOnPostResponse",
    fields: {
        message: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
        },
        data: { type: exports.onePostType },
    },
});
