import { HydratedDocument, Schema, Types } from "mongoose";
import mongoose from "mongoose";
import { IComment } from "../../common/interface";
import { s3Service } from "../../common/service";

const commentSchema = new Schema<IComment>(
  {

    content: {
      type: String,
      required: function (this) {
        return !this.attachments?.length;
      },
    },

    attachments: { type: [String] },

    postId:{type:Types.ObjectId , ref:"post" , required:true},
    commentId:{type:Types.ObjectId , ref:"comment"},

    likes: [{ type: Types.ObjectId, ref: "User" }],
    tags: [{ type: Types.ObjectId, ref: "User" }],

    updatedBy: { type: Types.ObjectId, ref: "User" },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    folderId: { type: String },

    deletedAt: { type: Date },
    restoredAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "social_app_comments",
  }
);

commentSchema.virtual("reply", {
  localField: "_id",
  foreignField: "commentId",
  ref: "comment",
  justOne: true,
});


commentSchema.pre(["find", "findOne" , "countDocuments"], function () {
  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, deletedAt: { $exists: false } });
  }
});

commentSchema.pre(["updateOne", "findOneAndUpdate"], function () {
  const update = this.getUpdate() as HydratedDocument<IComment>;
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

commentSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
  const query = this.getQuery();
  const doc = await this.model.findOne(query);
  if (!doc) return;
  const commentId = doc._id;
  const replies = await this.model.find({
    commentId,
  });

  for (const reply of replies) {

    if (reply.attachments?.length) {
      await s3Service.deleteBulkAsset({
        Keys: reply.attachments.map((ele: string) => ({
          Key: ele,
        })),
      });
    }

    await this.model.deleteOne({
      _id: reply._id,
      force: true,
    });
  }
});

export const commentModel =
  mongoose.models.comment || mongoose.model<IComment>("comment", commentSchema);
