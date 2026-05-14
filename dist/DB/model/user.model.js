"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enum_1 = require("../../common/enum");
const security_1 = require("../../common/utils/security");
const repository_1 = require("../repository");
const service_1 = require("../../common/service");
const post_model_1 = require("./post.model");
const userSchema = new mongoose_1.default.Schema({
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
        required: function () {
            return this.provider == enum_1.ProviderEnum.SYSTEM;
        },
    },
    age: Number,
    phone: String,
    gender: {
        type: Number,
        enum: enum_1.GenderEnum,
        default: enum_1.GenderEnum.MALE,
    },
    role: {
        type: Number,
        enum: enum_1.RoleEnum,
        default: enum_1.RoleEnum.USER,
    },
    provider: {
        type: Number,
        enum: enum_1.ProviderEnum,
        default: enum_1.ProviderEnum.SYSTEM,
    },
    freinds: [{ type: mongoose_1.Types.ObjectId, ref: "user" }],
    profilePicture: String,
    coverPictures: [String],
    confirmEmail: Date,
    deletedAt: Date,
    restoredAt: Date,
    changeCreadintialTime: Date,
}, {
    collection: "Route_users",
    timestamps: true,
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema
    .virtual("username")
    .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.firstName = firstName;
    this.lastName = lastName;
})
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
});
userSchema.pre("save", async function () {
    this.wasNew = this.isNew;
    if (this.password && this.isModified("password")) {
        this.password = await (0, security_1.generateHash)({ plainText: this.password });
    }
    if (this.phone && this.isModified("phone")) {
        this.phone = await (0, security_1.generateEncrypt)(this.phone);
    }
});
userSchema.pre(["find", "findOne"], function () {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
});
userSchema.pre(["updateOne", "findOneAndUpdate"], function () {
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
userSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
    const query = this.getQuery();
    const doc = await this.model.findOne(query);
    if (!doc)
        return;
    const postRepo = new repository_1.postRepository();
    const userId = doc._id;
    const comments = await postRepo.find({
        filter: {
            createdBy: userId
        }
    });
    for (const comment of comments) {
        if (comment.attachments?.length) {
            await service_1.s3Service.deleteBulkAsset({
                Keys: comment.attachments.map((ele) => ({
                    Key: ele,
                })),
            });
        }
        await post_model_1.postModel.deleteOne({
            _id: comment._id,
            force: true,
        });
    }
});
exports.userModel = mongoose_1.default.models.user || mongoose_1.default.model("user", userSchema);
