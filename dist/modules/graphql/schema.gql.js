"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const graphql_1 = require("graphql");
const post_1 = require("../post");
const user_schema_1 = require("../user/gql/user.schema");
const query = new graphql_1.GraphQLObjectType({
    name: "RootQueryType",
    description: "optional text to enhance understand api",
    fields: {
        ...user_schema_1.userGQLSchema.registerQuery(),
        ...post_1.postGQLSchema.registerQuery(),
    },
});
const mutation = new graphql_1.GraphQLObjectType({
    name: "RootmutationType",
    description: "optional text to enhance understand api",
    fields: {
        ...user_schema_1.userGQLSchema.registerMutation(),
        ...post_1.postGQLSchema.registerMutation(),
    },
});
exports.schema = new graphql_1.GraphQLSchema({
    query,
    mutation,
});
