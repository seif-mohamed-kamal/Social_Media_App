"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCommentSchema = exports.updateCommentSchema = exports.createReplyCommentSchema = exports.createCommentSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
const multer_1 = require("../../common/utils/multer");
exports.createCommentSchema = {
    params: zod_1.z.strictObject({
        postId: validation_1.generalValidationFeilds.id,
    }),
    body: zod_1.z
        .strictObject({
        content: zod_1.z.string().optional(),
        files: zod_1.z
            .array(validation_1.generalValidationFeilds.file(multer_1.fileExtention.image))
            .optional(),
        tags: zod_1.z.array(validation_1.generalValidationFeilds.id).optional(),
    })
        .superRefine((args, ctx) => {
        if ((!args.files || args.files.length === 0) && !args.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content is required",
            });
        }
        if (args.tags?.length) {
            const uniqueTags = [...new Set(args.tags)];
            if (uniqueTags.length != args.tags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "dublicated tags",
                });
            }
        }
    }),
};
exports.createReplyCommentSchema = {
    params: zod_1.z.strictObject({
        postId: validation_1.generalValidationFeilds.id,
        commentId: validation_1.generalValidationFeilds.id,
    }),
    body: exports.createCommentSchema.body
};
exports.updateCommentSchema = {
    params: zod_1.z.strictObject({
        commentId: validation_1.generalValidationFeilds.id,
    }),
    body: exports.createCommentSchema.body
};
exports.deleteCommentSchema = {
    params: zod_1.z.strictObject({
        commentId: validation_1.generalValidationFeilds.id,
        postId: validation_1.generalValidationFeilds.id,
    }),
};
