import { Types } from "mongoose";
import { IUser } from "./user.interface";

export interface IStory {
  createdBy: Types.ObjectId | IUser;
  text?: string;
  attachments?: string;
  type: number;
  expiresAt: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
  restoredAt?:Date
}