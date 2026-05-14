import { HydratedDocument, Types } from "mongoose";
import {
  createCommentDtoBody,
  createCommentDtoParams,
  createReplyCommentDtoParams,
  deleteCommentDtoParams,
} from "./comment.dto";
import { IComment, IPost, IUser } from "../../common/interface";
import { commentRepository, userRepository } from "../../DB/repository";
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
import { AvailabilityEnum } from "../../common/enum/post.enum";

class commentService {
  private readonly userModel: userRepository;
  private readonly redis: RedisService;
  private readonly postModel: postRepository;
  private readonly commentModel: commentRepository;
  private readonly notitfication: NotificationService;
  private readonly s3: S3Service;

  constructor() {
    this.userModel = new userRepository();
    this.postModel = new postRepository();
    this.commentModel = new commentRepository();
    this.redis = redisService;
    this.s3 = s3Service;
    this.notitfication = notificationService;
  }

  public async createComment(
    { postId }: createCommentDtoParams,
    { content, files = [], tags }: createCommentDtoBody,
    user: HydratedDocument<IUser>
  ): Promise<IComment> {
    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
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
    });
    if (!post) {
      throw new NotFoundException("Post Not Found");
    }
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
    const folderId = post.folderId;
    let urls: string[] = [];
    if (files?.length) {
      urls = await this.s3.uploadBulkAsset({
        files: files as Express.Multer.File[],
        Path: `Post/${folderId}`,
      });
    }

    const comment = await this.commentModel.createOne({
      data: {
        createdBy: user._id,
        content: content,
        attachments: urls,
        tags,
        postId: post._id,
        folderId: folderId,
      },
    });
    if (!comment) {
      if (urls?.length) {
        await this.s3.deleteBulkAsset({
          Keys: urls.map((ele) => {
            return { Key: ele };
          }),
        });
      }
      throw new BadRequestException("fail to create comment");
    }
    if (FCM_Tokens?.length) {
      await this.notitfication.sendBulkNotification({
        tokens: FCM_Tokens,
        data: {
          title: `post mention`,
          body: JSON.stringify({
            messaging: `${user.username} is mentioned you in a comment`,
            postId: post._id,
          }),
        },
      });
    }

    return comment.toJSON();
  }

  public async replyOnComment(
    { postId, commentId }: createReplyCommentDtoParams,
    { content, files = [], tags }: createCommentDtoBody,
    user: HydratedDocument<IUser>
  ): Promise<IComment> {
    const comment = await this.commentModel.findOne({
      filter: {
        _id: commentId,
        postId: postId,
      },
      options: {
        populate: [
          {
            path: "postId",
            match: {
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
          },
        ],
      },
    });
    if (!comment?.postId) {
      throw new NotFoundException("Post Not Found");
    }
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
    const post = comment.postId as HydratedDocument<IPost>;
    let urls: string[] = [];
    if (files?.length) {
      urls = await this.s3.uploadBulkAsset({
        files: files as Express.Multer.File[],
        Path: `Post/${post.folderId}`,
      });
    }

    const reply = await this.commentModel.createOne({
      data: {
        createdBy: user._id,
        content: content,
        attachments: urls,
        tags,
        postId: post._id,
        commentId: comment._id,
        folderId: post.folderId,
      },
    });
    if (!reply) {
      if (urls?.length) {
        await this.s3.deleteBulkAsset({
          Keys: urls.map((ele) => {
            return { Key: ele };
          }),
        });
      }
      throw new BadRequestException("fail to create comment");
    }
    if (FCM_Tokens?.length) {
      await this.notitfication.sendBulkNotification({
        tokens: FCM_Tokens,
        data: {
          title: `post mention`,
          body: JSON.stringify({
            messaging: `${user.username} is mentioned you in a comment`,
            postId: post._id,
            replyId: reply._id,
          }),
        },
      });
    }

    return comment.toJSON();
  }

  public async updateComment(
    { commentId }: createReplyCommentDtoParams,
    { content, files = [], tags }: createCommentDtoBody,
    user: HydratedDocument<IUser>
  ): Promise<IComment> {
    const comment = await this.commentModel.findOne({
      filter: {
        _id: commentId,
        createdBy: user._id,
      },
    });

    if (!comment) {
      throw new NotFoundException("comment Not Found");
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

      const oldTags = (comment.tags || []).map((tag) => tag.toString());

      for (const mention of mentionedUsers) {
        const mentionId = mention._id.toString();

        // newly added mentions only
        if (!oldTags.includes(mentionId)) {
          ((await this.redis.getFCMs(mentionId)) || []).forEach((token) =>
            FCM_Tokens.push(token)
          );
        }
      }
    }

    let urls = comment.attachments || [];

    if (files?.length) {
      const uploadedUrls = await this.s3.uploadBulkAsset({
        files: files as Express.Multer.File[],
        Path: `Comment/${comment.folderId}`,
      });

      urls = [...urls, ...uploadedUrls];
    }

    const updatedComment = await this.commentModel.findOneAndUpdate({
      filter: {
        _id: commentId,
      },
      update: {
        content,
        attachments: urls,
        tags,
      },
      options: {
        new: true,
      },
    });

    if (!updatedComment) {
      throw new BadRequestException("fail to update comment");
    }

    if (FCM_Tokens.length) {
      await this.notitfication.sendBulkNotification({
        tokens: FCM_Tokens,
        data: {
          title: `comment mention`,
          body: JSON.stringify({
            messaging: `${user.username} mentioned you in a comment`,
            commentId: updatedComment._id,
          }),
        },
      });
    }

    return updatedComment.toJSON();
  }

  public async deleteComment(
    { commentId }: deleteCommentDtoParams,
    user: HydratedDocument<IUser>
  ): Promise<IComment> {
  
    const comment = await this.commentModel.findOneAndDelete({
      filter: {
        _id: commentId,
        createdBy: user._id,
      },
    });
    if (!comment) {
      throw new NotFoundException("comment Not Found");
    }
  
    const urls = comment.attachments || [];
  
    if (urls.length) {
      await this.s3.deleteBulkAsset({
        Keys: urls.map((url) => ({
          Key: url,
        })),
      });
    }
  
    return comment.toJSON();
  }
}

export default new commentService();
