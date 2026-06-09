import { HydratedDocument } from "mongoose";
import { IChat, IUser } from "../../common/interface";
import {
  redisService,
  RedisService,
  s3Service,
  S3Service,
} from "../../common/service";
import { chatRepository, userRepository } from "../../DB/repository";
import { TokenService } from "../../common/service/token.service";
import {
  ConflictException,
  NotFoundException,
} from "../../common/exceptions/domain.exception";
import { logoutEnum } from "../../common/enum";
import { comapareeHash, generateHash } from "../../common/utils/security";
import { chatEnum } from "../../common/enum/chat.enum";

export class userService {
  private readonly userModel: userRepository;
  private readonly chatModel: chatRepository;
  private readonly redis: RedisService;
  private readonly tokenService: TokenService;
  private readonly s3: S3Service;

  constructor() {
    this.userModel = new userRepository();
    this.chatModel = new chatRepository();
    this.redis = redisService;
    this.s3 = s3Service;
    this.tokenService = new TokenService();
  }

  async profile(user: HydratedDocument<IUser>): Promise<{user:IUser , groups:HydratedDocument<IChat>[]}> {
    const groups = await this.chatModel.find({
      filter:{
        participants:{$in:[user._id]},
        type:chatEnum.ovm
      }
    })
    return {user:user.toJSON() , groups};
  }

  async rotateToken(
    user: HydratedDocument<IUser>,
    issuer: string,
    { jti, iat, sub }: { jti: string; iat: number; sub: string }
  ) {
    if ((iat + 60 * 60 * 24 * 365) * 1000 >= Date.now() + 5 * 60 * 1000) {
      throw new ConflictException("Current access token still valid");
    }
    await this.tokenService.createRevokeToken({
      userId: sub,
      jti,
      ttl: iat + 60 * 60 * 24 * 365,
    });
    return await this.tokenService.createLoginCredentials(user, issuer);
  }

  public async logout(
    flag: number,
    user: HydratedDocument<IUser>,
    { jti, iat, sub }: { jti: string; iat: number; sub: string }
  ) {
    // console.log({ jti, iat });
    let status = 200;
    // console.log({ sub });

    switch (flag) {
      case logoutEnum.All:
        user.changeCreadintialTime = new Date();
        await user.save();
        const tokenkeys = await this.redis.allKeysByPrefix(
          this.redis.baseRevokeTokenKey(sub)
        );
        // console.log({ tokenkeys });
        if (tokenkeys.length) {
          await this.redis.deleteKey(tokenkeys);
        }
        break;
      default:
        // console.log({ fun: allKeysByPrefix(baseRevokeTokenKey(sub)) });
        // console.log({ sub });
        await this.tokenService.createRevokeToken({
          userId: sub,
          jti,
          ttl: iat + 60 * 60 * 24 * 365,
        });
        status = 201;
        break;
    }
    return status;
  }

  public async updatePassword(
    { oldPassword, newPassword }: { oldPassword: string; newPassword: string },
    user: HydratedDocument<IUser>,
    issuer: string
  ) {
    if (
      !(await comapareeHash({
        plainText: oldPassword,
        ciphetText: user.password,
      }))
    ) {
      throw new ConflictException("invalid old password");
    }
    user.password = await generateHash({ plainText: newPassword });
    user.changeCreadintialTime = new Date();
    await user.save();
    await this.redis.deleteKey(
      await this.redis.allKeysByPrefix(this.redis.baseRevokeTokenKey(user._id))
    );
    return await this.tokenService.createLoginCredentials(user, issuer);
  }

  public async profileImg(
    {
      ContentType,
      OriginalName,
    }: { ContentType: string; OriginalName: string },
    user: HydratedDocument<IUser>
  ): Promise<{ user: IUser; url: string }> {
    const oldUrl = user.profilePicture;
    const { url, key } = await this.s3.createPreSignedUploadLink({
      Path: `${user._id.toString()}/profile`,
      OriginalName,
      ContentType,
    });
    user.profilePicture = key as string;
    if (oldUrl) {
      await this.s3.deleteAsset({ Key: oldUrl });
    }
    await user.save();

    // const res = await this.s3.uploadLargeFile({
    //   file,
    //   Path: `${user._id.toString()}/profile`,
    // });
    // console.log(res)

    return { user, url };
  }

  public async coverImg(
    files: Express.Multer.File[],
    user: HydratedDocument<IUser>
  ) {
    const oldUrls = user.coverPictures;
    const urls = await this.s3.uploadBulkAsset({
      files,
      Path: `${user._id.toString()}/profile/cover`,
    });
    user.coverPictures = urls;
    await user.save();
    if (oldUrls?.length) {
      await this.s3.deleteBulkAsset({
        Keys: oldUrls.map((ele) => ({ Key: ele })),
      });
    }
    return user.toJSON();
  }

  async deleteUser(user: HydratedDocument<IUser>) {
    const account = await this.userModel.deleteOne({
      filter: { _id: user._id, force: true },
    });
    if (!account.deletedCount) {
      return new NotFoundException("Account already deleted");
    }
    await this.s3.delteFolderByPrefix({ Prefix: `${user._id.toString()}` });
    return account;
  }
}

export default new userService();
