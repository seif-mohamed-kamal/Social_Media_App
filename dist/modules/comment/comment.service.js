"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const repository_1 = require("../../DB/repository");
const service_1 = require("../../common/service");
const post_repository_1 = require("../../DB/repository/post.repository");
const domain_exception_1 = require("../../common/exceptions/domain.exception");
const post_enum_1 = require("../../common/enum/post.enum");
class commentService {
    userModel;
    redis;
    postModel;
    commentModel;
    notitfication;
    s3;
    constructor() {
        this.userModel = new repository_1.userRepository();
        this.postModel = new post_repository_1.postRepository();
        this.commentModel = new repository_1.commentRepository();
        this.redis = service_1.redisService;
        this.s3 = service_1.s3Service;
        this.notitfication = service_1.notificationService;
    }
    async createComment({ postId }, { content, files = [], tags }, user) {
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                $or: [
                    { availability: post_enum_1.AvailabilityEnum.PUBLIC },
                    { availability: post_enum_1.AvailabilityEnum.ONLY_ME, createdBy: user._id },
                    {
                        availability: post_enum_1.AvailabilityEnum.PRIVATE,
                        createdBy: { $in: [user._id, ...(user.freinds || [])] },
                    },
                    { tags: { $in: [user._id] } },
                ],
            },
        });
        if (!post) {
            throw new domain_exception_1.NotFoundException("Post Not Found");
        }
        const mentions = [];
        const FCM_Tokens = [];
        if (tags?.length) {
            const mentionedUsers = await this.userModel.find({
                filter: {
                    _id: { $in: tags },
                },
            });
            if (mentionedUsers.length != tags.length) {
                throw new domain_exception_1.NotFoundException("Fail to find some users");
            }
            for (const tag of tags) {
                mentions.push(mongoose_1.Types.ObjectId.createFromHexString(tag));
                ((await this.redis.getFCMs(tag)) || []).map((token) => FCM_Tokens.push(token));
            }
        }
        const folderId = post.folderId;
        let urls = [];
        if (files?.length) {
            urls = await this.s3.uploadBulkAsset({
                files: files,
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
            throw new domain_exception_1.BadRequestException("fail to create comment");
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
    async replyOnComment({ postId, commentId }, { content, files = [], tags }, user) {
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
                                { availability: post_enum_1.AvailabilityEnum.PUBLIC },
                                { availability: post_enum_1.AvailabilityEnum.ONLY_ME, createdBy: user._id },
                                {
                                    availability: post_enum_1.AvailabilityEnum.PRIVATE,
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
            throw new domain_exception_1.NotFoundException("Post Not Found");
        }
        const mentions = [];
        const FCM_Tokens = [];
        if (tags?.length) {
            const mentionedUsers = await this.userModel.find({
                filter: {
                    _id: { $in: tags },
                },
            });
            if (mentionedUsers.length != tags.length) {
                throw new domain_exception_1.NotFoundException("Fail to find some users");
            }
            for (const tag of tags) {
                mentions.push(mongoose_1.Types.ObjectId.createFromHexString(tag));
                ((await this.redis.getFCMs(tag)) || []).map((token) => FCM_Tokens.push(token));
            }
        }
        const post = comment.postId;
        let urls = [];
        if (files?.length) {
            urls = await this.s3.uploadBulkAsset({
                files: files,
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
            throw new domain_exception_1.BadRequestException("fail to create comment");
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
    async updateComment({ commentId }, { content, files = [], tags }, user) {
        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                createdBy: user._id,
            },
        });
        if (!comment) {
            throw new domain_exception_1.NotFoundException("comment Not Found");
        }
        const FCM_Tokens = [];
        if (tags?.length) {
            const mentionedUsers = await this.userModel.find({
                filter: {
                    _id: { $in: tags },
                },
            });
            if (mentionedUsers.length !== tags.length) {
                throw new domain_exception_1.NotFoundException("Fail to find some users");
            }
            const oldTags = (comment.tags || []).map((tag) => tag.toString());
            for (const mention of mentionedUsers) {
                const mentionId = mention._id.toString();
                if (!oldTags.includes(mentionId)) {
                    ((await this.redis.getFCMs(mentionId)) || []).forEach((token) => FCM_Tokens.push(token));
                }
            }
        }
        let urls = comment.attachments || [];
        if (files?.length) {
            const uploadedUrls = await this.s3.uploadBulkAsset({
                files: files,
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
            throw new domain_exception_1.BadRequestException("fail to update comment");
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
    async deleteComment({ commentId }, user) {
        const comment = await this.commentModel.findOneAndDelete({
            filter: {
                _id: commentId,
                createdBy: user._id,
            },
        });
        if (!comment) {
            throw new domain_exception_1.NotFoundException("comment Not Found");
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
exports.default = new commentService();
