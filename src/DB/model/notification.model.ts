import { HydratedDocument, Schema, Types } from "mongoose";
import mongoose from "mongoose";
import { INotification } from "../../common/interface/notification.interface.js";

const receiverSchema = new Schema(
  {
    receiverId: {
      type: Types.ObjectId,
      ref: "user",
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const notificationSchema = new Schema<INotification>(
  {
    content: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    createdBy: {
      type: Types.ObjectId,
      ref: "user",
      required: true,
    },
    sendTo: receiverSchema,
    receiverIds: [receiverSchema],

    deletedAt: {
      type: Date,
    },

    restoredAt: {
      type: Date,
    },

    updatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "social_app_notifications",
  }
);

notificationSchema.pre(["find", "findOne", "countDocuments"], function () {
  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, deletedAt: { $exists: false } });
  }
});

notificationSchema.pre(["updateOne", "findOneAndUpdate"], function () {
  const update = this.getUpdate() as HydratedDocument<INotification>;
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

export const notificationModel =
  mongoose.models.notification ||
  mongoose.model<INotification>("notification", notificationSchema);
