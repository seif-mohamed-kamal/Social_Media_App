"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const repository_1 = require("../../DB/repository");
const service_1 = require("../../common/service");
const post_repository_1 = require("../../DB/repository/post.repository");
const domain_exception_1 = require("../../common/exceptions/domain.exception");
const crypto_1 = require("crypto");
const post_enum_1 = require("../../common/enum/post.enum");
class PostService {
    userModel;
    redis;
    postModel;
    notitfication;
    s3;
    constructor() {
        this.userModel = new repository_1.userRepository();
        this.postModel = new post_repository_1.postRepository();
        this.redis = service_1.redisService;
        this.s3 = service_1.s3Service;
        this.notitfication = service_1.notificationService;
    }
    async createPost({ content, files = [], tags, availability }, user) {
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
        const folderId = (0, crypto_1.randomUUID)();
        let urls = [];
        if (files?.length) {
            urls = await this.s3.uploadBulkAsset({
                files: files,
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
            throw new domain_exception_1.BadRequestException("fail to create post");
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
    async listPosts({ page, size }, user) {
        const posts = await this.postModel.paginate({
            filter: {
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
            page,
            size,
            options: {
                populate: [{ path: "comments", populate: [{ path: "reply" }] }],
            },
        });
        return posts;
    }
    async reactPost({ postId }, { react }, user) {
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                $or: [
                    { availability: post_enum_1.AvailabilityEnum.PUBLIC },
                    {
                        availability: post_enum_1.AvailabilityEnum.ONLY_ME,
                        createdBy: user._id,
                    },
                    {
                        availability: post_enum_1.AvailabilityEnum.PRIVATE,
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
        if (!post)
            throw new domain_exception_1.NotFoundException("post not found");
        const newReact = Number(react);
        post.reactions ??= [];
        const reactions = post.reactions;
        const index = reactions.findIndex((r) => r.userId.toString() === user._id.toString());
        if (index !== -1) {
            const existing = reactions[index];
            if (existing.react === newReact) {
                reactions.splice(index, 1);
            }
            else {
                reactions[index].react = newReact;
            }
        }
        else {
            reactions.push({
                userId: user._id,
                react: newReact,
            });
        }
        await post.save();
        return post.toJSON();
    }
    async updatePost({ postId }, { content, files = [], tags }, user) {
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                createdBy: user._id,
            },
        });
        if (!post) {
            throw new domain_exception_1.NotFoundException("post Not Found");
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
            const oldTags = (post.tags || []).map((tag) => tag.toString());
            for (const mention of mentionedUsers) {
                const mentionId = mention._id.toString();
                if (!oldTags.includes(mentionId)) {
                    ((await this.redis.getFCMs(mentionId)) || []).forEach((token) => FCM_Tokens.push(token));
                }
            }
        }
        let urls = post.attachments || [];
        if (files?.length) {
            const uploadedUrls = await this.s3.uploadBulkAsset({
                files: files,
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
            throw new domain_exception_1.BadRequestException("fail to update post");
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
    async deletepost({ postId }, user) {
        const post = await this.postModel.findOneAndDelete({
            filter: {
                _id: postId,
                createdBy: user._id,
            },
        });
        console.log({ post });
        if (!post) {
            throw new domain_exception_1.NotFoundException("post Not Found");
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
exports.default = new PostService();
