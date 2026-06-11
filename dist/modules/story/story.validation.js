"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStorySchema = exports.createStorySchema = void 0;
const zod_1 = require("zod");
exports.createStorySchema = {
    body: zod_1.z.strictObject({
        text: zod_1.z.string().min(1).optional(),
        attachments: zod_1.z.string().optional(),
        type: zod_1.z.number().optional(),
    }),
};
exports.updateStorySchema = {
    body: zod_1.z.strictObject({
        text: zod_1.z.string().min(1).optional(),
        attachments: zod_1.z.string().optional(),
        type: zod_1.z.number().optional(),
    }),
};
