"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../../middleware");
const response_1 = require("../../common/response");
const chat_servide_1 = require("./chat.servide");
const multer_1 = require("../../common/utils/multer");
const router = (0, express_1.Router)({ mergeParams: true });
router.get("/", (0, middleware_1.authintication)(), async (req, res, next) => {
    try {
        const chat = await chat_servide_1.chatService.getChat(req.params.userId, req.query, req.user);
        return (0, response_1.successResponse)({ res, result: { chat } });
    }
    catch (error) {
        return next(error);
    }
});
router.post("/group", (0, middleware_1.authintication)(), (0, multer_1.cloudUpload)({
    validation: multer_1.fileExtention.image,
}).single("file"), async (req, res, next) => {
    try {
        const chat = await chat_servide_1.chatService.createGroup(req.body, req.user, req.file);
        return (0, response_1.successResponse)({ res, result: { chat } });
    }
    catch (error) {
        return next(error);
    }
});
router.get("/group/:groupId", (0, middleware_1.authintication)(), async (req, res, next) => {
    try {
        let groupId = req.params["groupId"];
        const chat = await chat_servide_1.chatService.getChatGroup(groupId, req.user);
        return (0, response_1.successResponse)({ res, status: 201, result: { chat } });
    }
    catch (error) {
        console.error("OVM CHAT ERROR:", error);
        return next(error);
    }
});
exports.default = router;
