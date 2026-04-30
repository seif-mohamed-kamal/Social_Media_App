import { z } from "zod";

export const generalValidationFeilds = {
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
