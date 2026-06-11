import { model, models, Schema } from "mongoose";
import { HydratedDocument } from "mongoose";
import { IStory } from "../../common/interface";
import { StoryTypeEnum } from "../../common/enum";

const storySchema = new Schema<IStory>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    text: {
      type: String,
      default: "",
      required: function (this) {
        return this.attachments?.length;
      },
    },
    attachments: { type: String },
    type: {
      type: Number,
      enum: StoryTypeEnum,
      default: StoryTypeEnum.TEXT,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "social_app_stories",
  }
);

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

storySchema.pre(["find", "findOne", "countDocuments"], function () {
  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, deletedAt: { $exists: false } });
  }
});

storySchema.pre(["updateOne", "findOneAndUpdate"], function () {
  const update = this.getUpdate() as HydratedDocument<IStory>;
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
export const StoryModel = models.Story || model<IStory>("Story", storySchema);
