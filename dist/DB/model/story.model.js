"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryModel = void 0;
const mongoose_1 = require("mongoose");
const enum_1 = require("../../common/enum");
const storySchema = new mongoose_1.Schema({
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    text: {
        type: String,
        default: "",
        required: function () {
            return this.attachments?.length;
        },
    },
    attachments: { type: String },
    type: {
        type: Number,
        enum: enum_1.StoryTypeEnum,
        default: enum_1.StoryTypeEnum.TEXT,
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "social_app_stories",
});
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.pre(["find", "findOne", "countDocuments"], function () {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
});
storySchema.pre(["updateOne", "findOneAndUpdate"], function () {
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
exports.StoryModel = mongoose_1.models.Story || (0, mongoose_1.model)("Story", storySchema);
