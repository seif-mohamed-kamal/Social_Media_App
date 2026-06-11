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
const express_1 = require("express");
const middleware_1 = require("../../middleware");
const notification_service_1 = require("./notification.service");
const validators = __importStar(require("./notification.validation"));
const validation_middleware_1 = require("../../middleware/validation.middleware");
const response_1 = require("../../common/response");
const notification_authrization_1 = require("./notification.authrization");
const router = (0, express_1.Router)();
router.post("/sendOne", (0, middleware_1.authintication)(), (0, validation_middleware_1.validation)(validators.sendOneNotificationSchema), (0, middleware_1.authrization)(notification_authrization_1.endpoints.notification), async (req, res, next) => {
    const result = await notification_service_1.notificationServiceModule.sendOneNotification(req.body, req.user);
    return (0, response_1.successResponse)({ res, status: 201, result });
});
router.post("/sendBulk", (0, middleware_1.authintication)(), (0, validation_middleware_1.validation)(validators.sendBulkNotificationsSchema), (0, middleware_1.authrization)(notification_authrization_1.endpoints.notification), async (req, res, next) => {
    const result = await notification_service_1.notificationServiceModule.sendBulkNotifications(req.body, req.user);
    return (0, response_1.successResponse)({ res, status: 201, result });
});
router.get("/created", (0, middleware_1.authintication)(), (0, middleware_1.authrization)(notification_authrization_1.endpoints.notification), async (req, res, next) => {
    const result = await notification_service_1.notificationServiceModule.getAllNotification(req.user);
    return (0, response_1.successResponse)({ res, status: 200, result });
});
router.get("/mentioned", (0, middleware_1.authintication)(), (0, middleware_1.authrization)(notification_authrization_1.endpoints.notification), async (req, res, next) => {
    const result = await notification_service_1.notificationServiceModule.getAllMentionsNotifications(req.user);
    return (0, response_1.successResponse)({ res, status: 200, result });
});
router.patch("/:notificationId/read", (0, middleware_1.authintication)(), async (req, res, next) => {
    await notification_service_1.notificationServiceModule.markAsRead(req.params.notificationId, req.user);
    return (0, response_1.successResponse)({
        res,
        status: 200,
        message: "Notification marked as read",
    });
});
router.patch("/:notificationId", (0, middleware_1.authintication)(), (0, middleware_1.authrization)(notification_authrization_1.endpoints.notification), async (req, res, next) => {
    const result = await notification_service_1.notificationServiceModule.updateNotification(req.params.notificationId, req.body, req.user);
    return (0, response_1.successResponse)({
        res,
        status: 200,
        result,
    });
});
router.delete("/:notificationId", (0, middleware_1.authintication)(), (0, middleware_1.authrization)(notification_authrization_1.endpoints.notification), async (req, res, next) => {
    await notification_service_1.notificationServiceModule.deleteNotification(req.params.notificationId, req.user);
    return (0, response_1.successResponse)({
        res,
        status: 200,
        message: "Notification deleted successfully",
    });
});
exports.default = router;
