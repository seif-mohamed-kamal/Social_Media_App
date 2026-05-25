"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profile = exports.OneUserType = exports.RoleGQLEnumType = exports.ProviderGQLEnumType = exports.GenderGQLEnumType = void 0;
const graphql_1 = require("graphql");
const enum_1 = require("../../../common/enum");
exports.GenderGQLEnumType = new graphql_1.GraphQLEnumType({
    name: "GenderGQLEnumType",
    values: {
        Male: { value: enum_1.GenderEnum.MALE },
        Female: { value: enum_1.GenderEnum.FEMALE },
    },
});
exports.ProviderGQLEnumType = new graphql_1.GraphQLEnumType({
    name: "ProviderGQLEnumType",
    values: {
        Google: { value: enum_1.ProviderEnum.GOOGLE },
        System: { value: enum_1.ProviderEnum.SYSTEM },
    },
});
exports.RoleGQLEnumType = new graphql_1.GraphQLEnumType({
    name: "RoleGQLEnumType",
    values: {
        Admin: { value: enum_1.RoleEnum.ADMIN },
        User: { value: enum_1.RoleEnum.USER },
    },
});
exports.OneUserType = new graphql_1.GraphQLObjectType({
    name: "OneUserType",
    fields: () => ({
        _id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
        firstName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        lastName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        email: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        password: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        DOB: { type: graphql_1.GraphQLString },
        gender: { type: exports.GenderGQLEnumType },
        role: { type: exports.RoleGQLEnumType },
        phone: { type: graphql_1.GraphQLString },
        profilePicture: { type: graphql_1.GraphQLString },
        coverPictures: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        createdAt: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        updatedAt: { type: graphql_1.GraphQLString },
        changeCreadintialTime: { type: graphql_1.GraphQLString },
        confirmEmail: { type: graphql_1.GraphQLString },
        provider: { type: exports.ProviderGQLEnumType },
        freinds: { type: new graphql_1.GraphQLList(exports.OneUserType) },
        deletedAt: { type: graphql_1.GraphQLString },
        restoredAt: { type: graphql_1.GraphQLString },
    }),
});
exports.profile = new graphql_1.GraphQLNonNull(new graphql_1.GraphQLObjectType({
    name: "profileResponse",
    description: " Response",
    fields: {
        message: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        data: {
            type: exports.OneUserType,
        },
    },
}));
