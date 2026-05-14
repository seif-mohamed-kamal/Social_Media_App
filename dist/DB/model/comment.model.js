"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentModel = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const service_1 = require("../../common/service");
const commentSchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: { type: [String] },
    postId: { type: mongoose_1.Types.ObjectId, ref: "post", required: true },
    commentId: { type: mongoose_1.Types.ObjectId, ref: "comment" },
    likes: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    updatedBy: { type: mongoose_1.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    folderId: { type: String },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "social_app_comments",
});
commentSchema.virtual("reply", {
    localField: "_id",
    foreignField: "commentId",
    ref: "comment",
    justOne: true,
});
commentSchema.pre(["find", "findOne", "countDocuments"], function () {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
});
commentSchema.pre(["updateOne", "findOneAndUpdate"], function () {
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
commentSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
    const query = this.getQuery();
    const doc = await this.model.findOne(query);
    if (!doc)
        return;
    const commentId = doc._id;
    const replies = await this.model.find({
        commentId,
    });
    for (const reply of replies) {
        if (reply.attachments?.length) {
            await service_1.s3Service.deleteBulkAsset({
                Keys: reply.attachments.map((ele) => ({
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
exports.commentModel = mongoose_2.default.models.comment || mongoose_2.default.model("comment", commentSchema);
