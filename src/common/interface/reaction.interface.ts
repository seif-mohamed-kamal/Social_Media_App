import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { ReactionEnum } from "../enum/post.enum";

export interface IReaction {
    userId: Types.ObjectId | IUser;
    react: ReactionEnum;
  }