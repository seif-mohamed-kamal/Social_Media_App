import * as postArgs from "./post.args.gql";
import { postResolver, PostResolver } from "./post.resolver";
import * as postType from "./post.type.gql";

export class PostGQLSchema {
  private postResolver: PostResolver;

  constructor() {
    this.postResolver = postResolver;
  }

  registerQuery() {
    return {
      postList: {
        type: postType.postList,
        args: postArgs.postList,
        resolve: this.postResolver.postList,
      },
    };
  }

  registerMutation() {
    return {
      reactOnPost: {
        type: postType.reactOnPost,
        args: postArgs.reactOnPost,
        resolve: this.postResolver.reactOnPost,
      },
    };
  }
}

export const postGQLSchema = new PostGQLSchema();