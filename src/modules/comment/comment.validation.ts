import { z } from "zod";
import { generalValidationFeilds } from "../../common/validation";
import { fileExtention } from "../../common/utils/multer";

export const createCommentSchema = {
  params: z.strictObject({
    postId: generalValidationFeilds.id,
  }),
  body: z
    .strictObject({
      content: z.string().optional(),
      files: z
        .array(generalValidationFeilds.file(fileExtention.image))
        .optional(),
      tags: z.array(generalValidationFeilds.id).optional(),
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

export const createReplyCommentSchema = {
  params: z.strictObject({
    postId: generalValidationFeilds.id,
    commentId: generalValidationFeilds.id,
  }),
  body:createCommentSchema.body
};

export const updateCommentSchema = {
  params: z.strictObject({
    commentId: generalValidationFeilds.id,
  }),
  body:createCommentSchema.body
};

export const deleteCommentSchema = {
  params: z.strictObject({
    commentId: generalValidationFeilds.id,
    postId: generalValidationFeilds.id,

  }),
};