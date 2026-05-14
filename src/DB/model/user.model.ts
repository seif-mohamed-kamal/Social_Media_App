import mongoose, { HydratedDocument, Types } from "mongoose";
import { IUser } from "../../common/interface";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enum";
import { generateEncrypt, generateHash } from "../../common/utils/security";
import { postRepository } from "../repository";
import { s3Service } from "../../common/service";
import { postModel } from "./post.model";

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      minLength: [2, "firstname cannot be less than 2 characters"],
      maxLength: [25, "firstname cannot exceed 25 characters"],
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      minLength: [2, "lastname cannot be less than 2 characters"],
      maxLength: [25, "lastname cannot exceed 25 characters"],
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function (this) {
        return this.provider == ProviderEnum.SYSTEM;
      },
    },
    age: Number,
    phone: String,

    gender: {
      type: Number,
      enum: GenderEnum,
      default: GenderEnum.MALE,
    },

    role: {
      type: Number,
      enum: RoleEnum,
      default: RoleEnum.USER,
    },
    provider: {
      type: Number,
      enum: ProviderEnum,
      default: ProviderEnum.SYSTEM,
    },
    freinds: [{ type: Types.ObjectId, ref: "user" }],
    profilePicture: String,
    coverPictures: [String],

    confirmEmail: Date,
    deletedAt: Date,
    restoredAt: Date,
    changeCreadintialTime: Date,
  },
  {
    collection: "Route_users",
    timestamps: true,
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema
  .virtual("username")
  .set(function (value: string) {
    const [firstName, lastName] = value.split(" ") || [];
    this.firstName = firstName as string;
    this.lastName = lastName as string;
  })
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  });

userSchema.pre(
  "save",
  async function (this: HydratedDocument<IUser> & { wasNew: boolean }) {
    this.wasNew = this.isNew;
    if (this.password && this.isModified("password")) {
      this.password = await generateHash({ plainText: this.password });
    }
    if (this.phone && this.isModified("phone")) {
      this.phone = await generateEncrypt(this.phone);
    }
  }
);

userSchema.pre(["find", "findOne"], function () {
  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, deletedAt: { $exists: false } });
  }
});

userSchema.pre(["updateOne", "findOneAndUpdate"], function () {
  const update = this.getUpdate() as HydratedDocument<IUser>;
  if (update.restoredAt) {
    this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
  } else if (update.deletedAt) {
    this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
    this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } });
  }
  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ deletedAt: { $exists: false }, ...query });
  }
});

userSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
  const query = this.getQuery();
  const doc = await this.model.findOne(query);
  if (!doc) return;
  const postRepo = new postRepository();
  const userId = doc._id;
  const comments = await postRepo.find({
    filter:{
      createdBy:userId
    }
  });

  for (const comment of comments) {

    if (comment.attachments?.length) {
      await s3Service.deleteBulkAsset({
        Keys: comment.attachments.map((ele: string) => ({
          Key: ele,
        })),
      });
    }

    await postModel.deleteOne({
      _id: comment._id,
      force: true,
    });
  }
});


// userSchema.post("save" , async function(){
//   const that = this as HydratedDocument<IUser> & {wasNew:boolean }
//   console.log(that.wasNew)
// })

export const userModel =
  mongoose.models.user || mongoose.model<IUser>("user", userSchema);
