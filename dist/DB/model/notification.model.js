"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationModel = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const receiverSchema = new mongoose_1.Schema({
    receiverId: {
        type: mongoose_1.Types.ObjectId,
        ref: "user",
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, {
    _id: false,
});
const notificationSchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    createdBy: {
        type: mongoose_1.Types.ObjectId,
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "social_app_notifications",
});
notificationSchema.pre(["find", "findOne", "countDocuments"], function () {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
});
notificationSchema.pre(["updateOne", "findOneAndUpdate"], function () {
    const update = this.getUpdate();
    if (update.restoredAt) {
        this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
    }
    else if (update.deletedAt) {
        this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
        this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } });
    }
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ deletedAt: { $exists: false }, ...query });
    }
});
exports.notificationModel = mongoose_2.default.models.notification ||
    mongoose_2.default.model("notification", notificationSchema);
