import { Types } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../enum";

export interface IUser {
  firstName: string;
  lastName: string;
  username: string;
  email: String;
  password: string;
  age: number;
  phone?: string;
  freinds?: Types.ObjectId[] | IUser[];
  profilePicture?: string;
  coverPictures?: string[];
  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;
  changeCreadintialTime?: Date;
  DOB?: Date;
  confirmEmail?: Date;
  createdAt?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
  updatedAt?: Date;
}
