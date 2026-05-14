import { Types } from "mongoose";
import { z } from "zod";

export const generalValidationFeilds = {
  id:z.string().refine(value => {return Types.ObjectId.isValid(value)} , "Invalid ObjectId"),
  email: z.email(),
  password: z.string(),
  username: z.string(),
  confirmPassword: z.string(),
  phone: z.string(),
  otp: z.string().regex(/^\d{6}$/),
  FCM: z.string().optional(),
  file: function (mimType: string[]) {
    return z
      .strictObject({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.enum(mimType),
        buffer: z.any().optional(),
        path: z.string().optional(),
        size: z.number(),
      })
      .superRefine((args, ctx) => {
        if (!args.path && !args.buffer) {
          ctx.addIssue({
            code: "custom",
            path: ["buffer"],
            message: "buffer is required ",
          });
        }
      });
  },
};

export const paginationValidationSchmea = {
  query: z.strictObject({
    page: z.coerce.number().optional(),
    size: z.coerce.number().optional(),
    search: z.string().optional(),
  }),
};

export type paginateDTO = z.infer<typeof paginationValidationSchmea.query>