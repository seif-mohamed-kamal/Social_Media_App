import { HydratedDocument } from "mongoose";
import {
  sendBulkNotificationsDtoBody,
  sendOneNotificationDtoBody,
} from "./notification.dto";
import { INotification, IUser } from "../../common/interface";
import { notificationRepository } from "../../DB/repository/notification.repository";
import {
  notificationService,
  NotificationService,
  redisService,
  RedisService,
} from "../../common/service";
import { NotFoundException } from "../../common/exceptions/domain.exception";

export class NotificationServiceModule {
  private readonly notificationRepo: notificationRepository;
  private readonly redis: RedisService;
  private readonly notitfication: NotificationService;

  constructor() {
    this.notificationRepo = new notificationRepository();
    this.redis = redisService;
    this.notitfication = notificationService;
  }

  public async sendOneNotification(
    data: sendOneNotificationDtoBody,
    user: HydratedDocument<IUser>
  ): Promise<INotification> {
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
      throw new NotFoundException("No FCM token found");
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

  public async sendBulkNotifications(
    data: sendBulkNotificationsDtoBody,
    user: HydratedDocument<IUser>
  ): Promise<INotification> {
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
    const FCM_Tokens: string[] = [];

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

  public async getAllNotification(
    user: HydratedDocument<IUser>
  ): Promise<INotification[]> {
    const notifications = await this.notificationRepo.find({
      filter: {
        createdBy: user._id,
      },
    });
    if (notifications.length <= 0) {
      throw new NotFoundException("there is no notification you created");
    }
    return notifications;
  }

  public async getAllMentionsNotifications(
    user: HydratedDocument<IUser>
  ): Promise<INotification[]> {
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
      throw new NotFoundException("there is no notification you mentioned in");
    }
    return notifications;
  }

  public async markAsRead(
    notificationId: string,
    user: HydratedDocument<IUser>
  ): Promise<void> {
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
      throw new NotFoundException("Notification not found");
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
    } else {
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

  public async updateNotification(
    notificationId: string,
    data: {
      title?: string;
      content?: string;
      receiverIds?: string[];
    },
    user: HydratedDocument<IUser>
  ): Promise<INotification> {
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
      throw new NotFoundException("Notification not found");
    }

    if (data.receiverIds?.length) {
      const FCM_Tokens: string[] = [];

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

  public async deleteNotification(
    notificationId: string,
    user: HydratedDocument<IUser>
  ): Promise<void> {
    const notification = await this.notificationRepo.findOne({
      filter: {
        _id: notificationId,
        createdBy: user._id,
      },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    await this.notificationRepo.deleteOne({
      filter: {
        _id: notificationId,
      },
    });
  }
}
export const notificationServiceModule = new NotificationServiceModule();
