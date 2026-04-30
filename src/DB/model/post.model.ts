import { HydratedDocument, Schema, Types } from "mongoose";
import { IPost } from "../../common/interface/post.intedface.js";
import { AvailabilityEnum } from "../../common/enum/post.enum.js";
import mongoose from "mongoose";

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

    likes: [{ type: Types.ObjectId, ref: "User" }],
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


postSchema.pre(["find", "findOne"], function () {
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

postSchema.pre(["deleteOne", "findOneAndDelete"], function () {

  const query = this.getQuery();
  if (query.force === true) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ deletedAt: { $exists: true }, ...query });
  }
});

export const postModel =
  mongoose.models.post || mongoose.model<IPost>("post", postSchema);
