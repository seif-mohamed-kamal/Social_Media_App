"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const repository_1 = require("../../DB/repository");
const service_1 = require("../../common/service");
const post_repository_1 = require("../../DB/repository/post.repository");
const domain_exception_1 = require("../../common/exceptions/domain.exception");
const crypto_1 = require("crypto");
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
}
exports.default = new PostService();
