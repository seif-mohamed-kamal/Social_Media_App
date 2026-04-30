import { HydratedDocument, Types } from "mongoose";
import { createPostDtoBody } from "./post.dto";
import { IPost, IUser } from "../../common/interface";
import { userRepository } from "../../DB/repository";
import {
  notificationService,
  NotificationService,
  redisService,
  RedisService,
  S3Service,
  s3Service,
} from "../../common/service";
import { postRepository } from "../../DB/repository/post.repository";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/exceptions/domain.exception";
import { randomUUID } from "crypto";

class PostService {
  private readonly userModel: userRepository;
  private readonly redis: RedisService;
  private readonly postModel: postRepository;
  private readonly notitfication: NotificationService;
  private readonly s3: S3Service;

  constructor() {
    this.userModel = new userRepository();
    this.postModel = new postRepository();
    this.redis = redisService;
    this.s3 = s3Service;
    this.notitfication = notificationService;
  }

  public async createPost(
    { content, files = [], tags, availability }: createPostDtoBody,
    user: HydratedDocument<IUser>
  ): Promise<IPost> {
    const mentions: Types.ObjectId[] = [];
    const FCM_Tokens: string[] = [];
    if (tags?.length) {
      const mentionedUsers = await this.userModel.find({
        filter: {
          _id: { $in: tags },
        },
      });
      if (mentionedUsers.length != tags.length) {
        throw new NotFoundException("Fail to find some users");
      }
      for (const tag of tags) {
        mentions.push(Types.ObjectId.createFromHexString(tag));
        ((await this.redis.getFCMs(tag)) || []).map((token) =>
          FCM_Tokens.push(token)
        );
      }
    }
    const folderId = randomUUID();
    let urls: string[] = [];
    if (files?.length) {
      urls = await this.s3.uploadBulkAsset({
        files: files as Express.Multer.File[],
        Path: `Post/${folderId}`,
      });
    }

    const post = await this.postModel.createOne({
      data: {
        createdBy: user._id,
        content: content,
        attachments: urls,
        tags,
        availability,
        folderId,
      },
    });
    if (!post) {
      if (urls?.length) {
        await this.s3.deleteBulkAsset({
          Keys: urls.map((ele) => {
            return { Key: ele };
          }),
        });
      }
      throw new BadRequestException("fail to create post");
    }
    if (FCM_Tokens?.length) {
      await this.notitfication.sendBulkNotification({
        tokens: FCM_Tokens,
        data: {
          title: `post mention`,
          body: JSON.stringify({
            messaging: `${user.username} is mentioned you in a post`,
            postId: post._id,
          }),
        },
      });
    }

    return post.toJSON();
  }
}

export default new PostService();
