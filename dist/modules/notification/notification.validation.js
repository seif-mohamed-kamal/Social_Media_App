"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBulkNotificationsSchema = exports.sendOneNotificationSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
exports.sendOneNotificationSchema = {
    body: zod_1.z.strictObject({
        content: zod_1.z.string().min(2),
        title: zod_1.z.string().min(2),
        sendTo: validation_1.generalValidationFeilds.id,
    }),
};
exports.sendBulkNotificationsSchema = {
    body: zod_1.z.strictObject({
        content: zod_1.z.string().min(2),
        title: zod_1.z.string().min(2),
        receiverId: zod_1.z.array(zod_1.z.string()).min(1),
    }),
};
