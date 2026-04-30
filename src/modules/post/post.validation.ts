import { z } from "zod";
import { AvailabilityEnum } from "../../common/enum/post.enum";
import { Types } from "mongoose";
import { generalValidationFeilds } from "../../common/validation";
import { fileExtention } from "../../common/utils/multer";
export const createPostSchema = {
  body: z
    .strictObject({
      content: z.string().optional(),
      files: z.array(generalValidationFeilds.file(fileExtention.image)).optional(),
      tags: z.array(z.string()).optional(),
      availability: z.coerce.number().default(AvailabilityEnum.PUBLIC),
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
        for (const tag of args.tags) {
          if (!Types.ObjectId.isValid(tag)) {
            ctx.addIssue({
              code: "custom",
              path: ["tags"],
              message: "Invalid ObjectId",
            });
          }
        }
      }
    }),
};
