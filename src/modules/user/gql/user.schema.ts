import { GraphQLString } from "graphql";
import * as UserGQLTypes from "./user.types.gql";
import * as UserGQLArgs from "./user.args.gql";
import { UserResolver } from "./user.resolver";
export class UserGQLSchema {
  private userResolver: UserResolver;
  constructor() {
    this.userResolver = new UserResolver();
  }

  registerQuery() {
    return {
      Profile: {
        type: UserGQLTypes.profile,
        description: "profile",
        args: UserGQLArgs.profile,
        resolve: this.userResolver.profile,
      },
    };
  }

  registerMutation() {
    return {
      like: {
        type: GraphQLString,
        resolve: () => {
          return "welcome mutation";
        },
      },
    };
  }
}

export const userGQLSchema = new UserGQLSchema();