import { Types } from "mongoose";
import { IUser } from "./user.interface.js";
import { IPost } from "./post.intedface.js";

export interface IComment {
  content?: string;
  attachments?: string[];
  folderId?: string;

  likes?: Types.ObjectId[] | IUser[];
  tags?: Types.ObjectId[] | IUser[];

  postId:Types.ObjectId | IPost;
  commentId:Types.ObjectId | IComment;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  createdAt: Date;
  updatedAt?: Date;

  deletedAt?: Date;
  restoredAt?: Date;
}