import { PostService } from "../post.service";
import { IAuthUser } from "../../../common/types/express.types";
import { UnauthorizedException } from "../../../common/exceptions/domain.exception";
import { GQLValidation } from "../../../middleware/validation.middleware";
import {
  paginateDTO,
  paginationValidationSchmea,
} from "../../../common/validation";
import { ReactOnPostArgsDto } from "../post.dto";
import { reactOnPostGQL } from "../post.validation";

export class PostResolver {
  private postService: PostService;

  constructor() {
    this.postService = new PostService();
  }
  postList = async (parent: any, args: paginateDTO, { user }: IAuthUser) => {
    if (!user) {
      throw new UnauthorizedException("unAuthrized user");
    }
    await GQLValidation<paginateDTO>(paginationValidationSchmea.query, args);
    const data = await this.postService.listPosts(args, user);
    return { message: "Done", data };
  };

  reactOnPost = async (
    parent: unknown,
    { postId, react }: ReactOnPostArgsDto,
    { user }: IAuthUser
  ) => {
    await GQLValidation<ReactOnPostArgsDto>(reactOnPostGQL, { postId, react });  

    const data = await this.postService.reactPost(
      { postId },
      { react },
      user
    );

    return {
      message: "Done",
      data,
    };
  };
}

export const postResolver = new PostResolver();
