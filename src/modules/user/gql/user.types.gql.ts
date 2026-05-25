import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../../common/enum";


export const GenderGQLEnumType = new GraphQLEnumType({
  name: "GenderGQLEnumType",
  values: {
    Male: { value: GenderEnum.MALE },
    Female: { value: GenderEnum.FEMALE },
  },
});

export const ProviderGQLEnumType = new GraphQLEnumType({
  name: "ProviderGQLEnumType",
  values: {
    Google: { value: ProviderEnum.GOOGLE },
    System: { value: ProviderEnum.SYSTEM },
  },
});

export const RoleGQLEnumType = new GraphQLEnumType({
  name: "RoleGQLEnumType",
  values: {
    Admin: { value: RoleEnum.ADMIN },
    User: { value: RoleEnum.USER },
  },
});

export const OneUserType: GraphQLObjectType = new GraphQLObjectType({
  name: "OneUserType",
  // Lase Loading 
  fields: () => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
    DOB: { type: GraphQLString },
    gender: { type: GenderGQLEnumType },
    role: { type: RoleGQLEnumType },
    phone: { type: GraphQLString },
    profilePicture: { type: GraphQLString },
    coverPictures: { type: new GraphQLList(GraphQLString) },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
    updatedAt: { type: GraphQLString },
    changeCreadintialTime: { type: GraphQLString },
    confirmEmail: { type: GraphQLString },
    provider: { type: ProviderGQLEnumType },
    freinds: { type: new GraphQLList(OneUserType) },
    deletedAt: { type: GraphQLString },
    restoredAt: { type: GraphQLString },
  }),
});

export const profile = new GraphQLNonNull(
  new GraphQLObjectType({
    name: "profileResponse",
    description: " Response",
    fields: {
      message: { type: new GraphQLNonNull(GraphQLString) },
      data: {
        type: OneUserType,
      },
    },
  })
);
