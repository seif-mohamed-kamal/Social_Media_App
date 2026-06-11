"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationServiceModule = exports.NotificationServiceModule = void 0;
const notification_repository_1 = require("../../DB/repository/notification.repository");
const service_1 = require("../../common/service");
const domain_exception_1 = require("../../common/exceptions/domain.exception");
class NotificationServiceModule {
    notificationRepo;
    redis;
    notitfication;
    constructor() {
        this.notificationRepo = new notification_repository_1.notificationRepository();
        this.redis = service_1.redisService;
        this.notitfication = service_1.notificationService;
    }
    async sendOneNotification(data, user) {
        const notification = await this.notificationRepo.createOne({
            data: {
                title: data.title,
                content: data.content,
                sendTo: {
                    receiverId: data.sendTo,
                    isRead: false,
                },
                createdBy: user._id,
                createdAt: new Date(),
            },
        });
        const FCM_TOKEN = await this.redis.getFCMs(data.sendTo);
        const token = FCM_TOKEN.at(0);
        if (!token) {
            throw new domain_exception_1.NotFoundException("No FCM token found");
        }
        await this.notitfication.sendNotification({
            token,
            data: {
                title: data.title,
                body: data.content,
            },
        });
        return notification;
    }
    async sendBulkNotifications(data, user) {
        const notification = await this.notificationRepo.createOne({
            data: {
                title: data.title,
                content: data.content,
                receiverIds: data.receiverId.map((id) => ({
                    receiverId: id,
                    isRead: false,
                })),
                createdBy: user._id,
                createdAt: new Date(),
            },
        });
        const FCM_Tokens = [];
        const tags = data.receiverId;
        for (const tag of tags) {
            const tokens = (await this.redis.getFCMs(tag)) || [];
            FCM_Tokens.push(...tokens);
        }
        const uniqueTokens = [...new Set(FCM_Tokens)];
        if (FCM_Tokens?.length) {
            await this.notitfication.sendBulkNotification({
                tokens: uniqueTokens,
                data: {
                    title: data.title,
                    body: data.content,
                },
            });
        }
        return notification;
    }
    async getAllNotification(user) {
        const notifications = await this.notificationRepo.find({
            filter: {
                createdBy: user._id,
            },
        });
        if (notifications.length <= 0) {
            throw new domain_exception_1.NotFoundException("there is no notification you created");
        }
        return notifications;
    }
    async getAllMentionsNotifications(user) {
        const notifications = await this.notificationRepo.find({
            filter: {
                $or: [
                    { "sendTo.receiverId": user._id },
                    { "receiverIds.receiverId": user._id },
                ],
            },
            projection: "-sendTo.receiverId -receiverIds.receiverId",
        });
        if (notifications.length <= 0) {
            throw new domain_exception_1.NotFoundException("there is no notification you mentioned in");
        }
        return notifications;
    }
    async markAsRead(notificationId, user) {
        const notification = await this.notificationRepo.findOne({
            filter: {
                _id: notificationId,
                $or: [
                    { "sendTo.receiverId": user._id },
                    { "receiverIds.receiverId": user._id },
                ],
            },
        });
        if (!notification) {
            throw new domain_exception_1.NotFoundException("Notification not found");
        }
        if (notification.sendTo?.receiverId?.toString() === user._id.toString()) {
            await this.notificationRepo.findOneAndUpdate({
                filter: {
                    _id: notificationId,
                    "sendTo.receiverId": user._id,
                },
                update: {
                    $set: {
                        "sendTo.isRead": true,
                    },
                },
                options: {
                    new: true,
                },
            });
        }
        else {
            await this.notificationRepo.findOneAndUpdate({
                filter: {
                    _id: notificationId,
                    "receiverIds.receiverId": user._id,
                },
                update: {
                    $set: {
                        "receiverIds.$.isRead": true,
                    },
                },
                options: {
                    new: true,
                },
            });
        }
    }
    async updateNotification(notificationId, data, user) {
        const notification = await this.notificationRepo.findOneAndUpdate({
            filter: {
                _id: notificationId,
                createdBy: user._id,
            },
            update: {
                $set: {
                    title: data.title,
                    content: data.content,
                    ...(data.receiverIds && {
                        receiverIds: data.receiverIds.map((id) => ({
                            receiverId: id,
                            isRead: false,
                        })),
                    }),
                    updatedAt: new Date(),
                },
            },
            options: {
                returnDocument: "after",
            },
        });
        if (!notification) {
            throw new domain_exception_1.NotFoundException("Notification not found");
        }
        if (data.receiverIds?.length) {
            const FCM_Tokens = [];
            const tags = data.receiverIds;
            for (const tag of tags) {
                const tokens = (await this.redis.getFCMs(tag)) || [];
                FCM_Tokens.push(...tokens);
            }
            const uniqueTokens = [...new Set(FCM_Tokens)];
            if (uniqueTokens.length) {
                await this.notitfication.sendBulkNotification({
                    tokens: uniqueTokens,
                    data: {
                        title: notification.title,
                        body: notification.content,
                    },
                });
            }
        }
        return notification;
    }
    async deleteNotification(notificationId, user) {
        const notification = await this.notificationRepo.findOne({
            filter: {
                _id: notificationId,
                createdBy: user._id,
            },
        });
        if (!notification) {
            throw new domain_exception_1.NotFoundException("Notification not found");
        }
        await this.notificationRepo.deleteOne({
            filter: {
                _id: notificationId,
            },
        });
    }
}
exports.NotificationServiceModule = NotificationServiceModule;
exports.notificationServiceModule = new NotificationServiceModule();
