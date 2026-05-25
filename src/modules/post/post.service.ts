import { HydratedDocument, Types } from "mongoose";
import {
  createPostDtoBody,
  deletePostDTOParams,
  reactPostParamsDTO,
  reactPostQuetyDTO,
  updatePostDTOParams,
} from "./post.dto";
import { IPaginate, IPost, IUser } from "../../common/interface";
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
import { AvailabilityEnum } from "../../common/enum/post.enum";
import { paginateDTO } from "../../common/validation";

export class PostService {
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

  public async listPosts(
    { page, size }: paginateDTO,
    user: HydratedDocument<IUser>
  ): Promise<IPaginate<IPost>> {
    const posts = await this.postModel.paginate({
      filter: {
        $or: [
          { availability: AvailabilityEnum.PUBLIC },
          { availability: AvailabilityEnum.ONLY_ME, createdBy: user._id },
          {
            availability: AvailabilityEnum.PRIVATE,
            createdBy: { $in: [user._id, ...(user.freinds || [])] },
          },
          { tags: { $in: [user._id] } },
        ],
      },
      page,
      size,
      options: {
        populate: [{ path: "comments", populate: [{ path: "reply" }] }],
      },
    });
    return posts;
  }

    public async reactPost(
      { postId }: reactPostParamsDTO,
      { react }: reactPostQuetyDTO,
      user: HydratedDocument<IUser>
    ): Promise<IPost> {
    
      const post = await this.postModel.findOne({
        filter:{
        _id: postId,
    
        $or: [
          { availability: AvailabilityEnum.PUBLIC },
    
          {
            availability: AvailabilityEnum.ONLY_ME,
            createdBy: user._id,
          },
    
          {
            availability: AvailabilityEnum.PRIVATE,
            createdBy: {
              $in: [user._id, ...(user.freinds || [])],
            },
          },
    
          {
            tags: { $in: [user._id] },
          },
        ],
      }
      });
    
      if (!post) throw new NotFoundException("post not found");
    
      const newReact = Number(react);
      post.reactions ??= [];

      const reactions = post.reactions!;
      
      const index = reactions.findIndex(
        (r) => r.userId.toString() === user._id.toString()
      );
      
      if (index !== -1) {
        const existing = reactions[index]!;
      
        if (existing.react === newReact) {
          reactions.splice(index, 1);
        } else {
          reactions[index]!.react = newReact;
        }
      } else {
        reactions.push({
          userId: user._id,
          react: newReact,
        });
      }
      await post.save();
    
      return post.toJSON();
    }
  public async updatePost(
    { postId }: updatePostDTOParams,
    { content, files = [], tags }: createPostDtoBody,
    user: HydratedDocument<IUser>
  ): Promise<IPost> {
    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
        createdBy: user._id,
      },
    });

    if (!post) {
      throw new NotFoundException("post Not Found");
    }

    const FCM_Tokens: string[] = [];

    if (tags?.length) {
      const mentionedUsers = await this.userModel.find({
        filter: {
          _id: { $in: tags },
        },
      });

      if (mentionedUsers.length !== tags.length) {
        throw new NotFoundException("Fail to find some users");
      }

      const oldTags = (post.tags || []).map((tag) => tag.toString());

      for (const mention of mentionedUsers) {
        const mentionId = mention._id.toString();

        if (!oldTags.includes(mentionId)) {
          ((await this.redis.getFCMs(mentionId)) || []).forEach((token) =>
            FCM_Tokens.push(token)
          );
        }
      }
    }

    let urls = post.attachments || [];

    if (files?.length) {
      const uploadedUrls = await this.s3.uploadBulkAsset({
        files: files as Express.Multer.File[],
        Path: `post/${post.folderId}`,
      });

      urls = [...urls, ...uploadedUrls];
    }

    const updatedPost = await this.postModel.findOneAndUpdate({
      filter: {
        _id: postId,
      },
      update: {
        content,
        attachments: urls,
        tags,
      },
    });

    if (!updatedPost) {
      throw new BadRequestException("fail to update post");
    }

    if (FCM_Tokens.length) {
      await this.notitfication.sendBulkNotification({
        tokens: FCM_Tokens,
        data: {
          title: `post mention`,
          body: JSON.stringify({
            messaging: `${user.username} mentioned you in a post`,
            commentId: updatedPost._id,
          }),
        },
      });
    }

    return updatedPost.toJSON();
  }

  public async deletepost(
    { postId }: deletePostDTOParams,
    user: HydratedDocument<IUser>
  ): Promise<IPost> {
    const post = await this.postModel.findOneAndDelete({
      filter: {
        _id: postId,
        createdBy: user._id,
      },
    });
    console.log({ post });
    if (!post) {
      throw new NotFoundException("post Not Found");
    }

    const urls = post.attachments || [];

    if (urls.length) {
      await this.s3.deleteBulkAsset({
        Keys: urls.map((url) => ({
          Key: url,
        })),
      });
    }

    return post.toJSON();
  }
}

export default new PostService();
