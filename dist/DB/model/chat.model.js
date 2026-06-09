"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatModel = void 0;
const mongoose_1 = require("mongoose");
const chat_enum_1 = require("../../common/enum/chat.enum");
const messageSchema = new mongoose_1.Schema({
    content: {
        type: String, required: function () {
            return !this.attachments?.length;
        }
    },
    attachments: { type: [String] },
    likes: [{ type: mongoose_1.Types.ObjectId, ref: "user" }],
    tags: [{ type: mongoose_1.Types.ObjectId, ref: "user" }],
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "user", required: true },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
    updatedAt: { type: Date }
});
const chatSchema = new mongoose_1.Schema({
    participants: [{ type: mongoose_1.Types.ObjectId, ref: "user" }],
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "user", required: true },
    messages: { type: [messageSchema], required: true },
    type: { type: String, enum: chat_enum_1.chatEnum, required: true },
    group: { type: String },
    group_image: { type: String },
    roomId: { type: String },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
    updatedAt: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_CHATS"
});
chatSchema.pre(["find", "findOne", "findOneAndUpdate"], function () {
    if (!this.getFilter) {
        return;
    }
    const filter = this.getFilter();
    if (filter?.deletedAt === undefined) {
        this.setQuery({ ...filter, deletedAt: null });
    }
});
chatSchema.pre("updateOne", function () {
    if (!this.getFilter) {
        return;
    }
    const filter = this.getFilter();
    if (filter?.deletedAt === undefined) {
        this.setQuery({ ...filter, deletedAt: null });
    }
});
chatSchema.pre("findOneAndUpdate", function () {
    if (!this.getFilter) {
        return;
    }
    const filter = this.getFilter();
    if (filter?.deletedAt === undefined) {
        this.setQuery({ ...filter, deletedAt: null });
    }
});
exports.chatModel = mongoose_1.models.chat || (0, mongoose_1.model)("chat", chatSchema);
