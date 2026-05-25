"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactOnPost = exports.postList = void 0;
const graphql_1 = require("graphql");
const post_type_gql_1 = require("./post.type.gql");
exports.postList = {
    page: { type: graphql_1.GraphQLInt },
    size: { type: graphql_1.GraphQLInt },
    search: { type: graphql_1.GraphQLString },
};
exports.reactOnPost = {
    postId: {
        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID),
    },
    react: {
        type: new graphql_1.GraphQLNonNull(post_type_gql_1.reactionGQLEnumType),
    },
};
