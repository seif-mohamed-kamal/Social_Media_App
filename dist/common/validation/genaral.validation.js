"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalValidationFeilds = void 0;
const zod_1 = require("zod");
exports.generalValidationFeilds = {
    email: zod_1.z.email(),
    password: zod_1.z.string(),
    username: zod_1.z.string(),
    confirmPassword: zod_1.z.string(),
    phone: zod_1.z.string(),
    otp: zod_1.z.string().regex(/^\d{6}$/),
    FCM: zod_1.z.string().optional(),
    file: function (mimType) {
        return zod_1.z
            .strictObject({
            fieldname: zod_1.z.string(),
            originalname: zod_1.z.string(),
            encoding: zod_1.z.string(),
            mimetype: zod_1.z.enum(mimType),
            buffer: zod_1.z.any().optional(),
            path: zod_1.z.string().optional(),
            size: zod_1.z.number(),
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
