import { Types } from "mongoose";

export interface INotificationReceiver {
  receiverId: Types.ObjectId | string;
  isRead: boolean;
}

export interface INotification {
  createdBy: Types.ObjectId | string;

  sendTo?: INotificationReceiver;

  receiverIds?: INotificationReceiver[];

  title: string;
  content: string;

  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
}