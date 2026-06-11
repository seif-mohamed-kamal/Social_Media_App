import { IAuthUser } from "../../../common/types/express.types";
import { GQLAuthorization } from "../../../middleware";
import { GQLValidation } from "../../../middleware/validation.middleware";
import { endpoints } from "../user.authrization";
import { userService } from "../user.service";
import { profileGQL } from "../user.validation";

export class UserResolver {
  private service: userService;

  constructor() {
    this.service = new userService();
  }

  profile = async (
    parent: unknown,
    args: {
      search?: string;
    },
    { user }: IAuthUser,
): Promise<any> => {
    // authentication
    if (!user) {
      throw new Error("Unauthorized");
    }
    await GQLAuthorization(endpoints.profile,user);
    await GQLValidation<{
      search?: string;
    }>(profileGQL,args);
    const data = await this.service.profile(user);

    return {
      message: "hi",
      data,
    };
  };
}

export const userResolver = new UserResolver();