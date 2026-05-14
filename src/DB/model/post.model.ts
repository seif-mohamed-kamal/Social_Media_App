import { HydratedDocument, Schema, Types } from "mongoose";
import { IPost } from "../../common/interface/post.intedface.js";
import { AvailabilityEnum, ReactionEnum } from "../../common/enum/post.enum.js";
import mongoose from "mongoose";
import { commentModel } from "./comment.model.js";
import { s3Service } from "../../common/service/s3.service.js";
import { commentRepository } from "../repository/comment.repository.js";

const postSchema = new Schema<IPost>(
  {
    folderId: { type: String, required: true },

    content: {
      type: String,
      required: function (this) {
        return !this.attachments?.length;
      },
    },

    attachments: { type: [String] },

    availability: {
      type: Number,
      enum: AvailabilityEnum,
      default: AvailabilityEnum.PUBLIC,
    },

    reactions: [
      {
        userId: {
          type: Types.ObjectId,
          ref: "User",
          required: true,
        },
    
        react: {
          type: Number,
          enum: ReactionEnum,
          required: true,
        },
      },
    ],
    tags: [{ type: Types.ObjectId, ref: "User" }],

    updatedBy: { type: Types.ObjectId, ref: "User" },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },

    deletedAt: { type: Date },
    restoredAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "social_app_posts",
  }
);

postSchema.virtual("comments", {
  localField: "_id",
  foreignField: "postId",
  ref: "comment",
  justOne: true,
});

postSchema.pre(["find", "findOne", "countDocuments"], function () {
  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, deletedAt: { $exists: false } });
  }
});

postSchema.pre(["updateOne", "findOneAndUpdate"], function () {
  const update = this.getUpdate() as HydratedDocument<IPost>;
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

postSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
  const query = this.getQuery();
  const doc = await this.model.findOne(query);
  if (!doc) return;
  const commentRepo = new commentRepository();
  const postId = doc._id;
  const comments = await commentRepo.find({
    filter:{
      postId
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

    await commentModel.deleteOne({
      _id: comment._id,
      force: true,
    });
  }
});

export const postModel =
  mongoose.models.post || mongoose.model<IPost>("post", postSchema);
