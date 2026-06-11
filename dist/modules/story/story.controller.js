"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../../middleware");
const response_1 = require("../../common/response");
const story_service_1 = require("./story.service");
const multer_1 = require("../../common/utils/multer");
const router = (0, express_1.Router)();
router.post("/", (0, middleware_1.authintication)(), (0, multer_1.localFileUpload)({
    folderName: "stories",
    validation: multer_1.fileExtention.image,
}).single("file"), async (req, res, next) => {
    const result = await story_service_1.storyServiceModule.createStory(req.body, req.user, req.file);
    return (0, response_1.successResponse)({
        res,
        status: 201,
        result,
    });
});
router.get("/my", (0, middleware_1.authintication)(), async (req, res, next) => {
    const result = await story_service_1.storyServiceModule.getMyStories(req.user);
    return (0, response_1.successResponse)({
        res,
        status: 200,
        result,
    });
});
router.get("/:storyId", (0, middleware_1.authintication)(), async (req, res, next) => {
    const result = await story_service_1.storyServiceModule.getStoryById(req.params.storyId, req.user);
    return (0, response_1.successResponse)({
        res,
        status: 200,
        result,
    });
});
router.patch("/:storyId", (0, middleware_1.authintication)(), async (req, res, next) => {
    const result = await story_service_1.storyServiceModule.updateStory(req.params.storyId, req.body, req.user);
    return (0, response_1.successResponse)({
        res,
        status: 200,
        result,
    });
});
router.delete("/:storyId", (0, middleware_1.authintication)(), async (req, res, next) => {
    await story_service_1.storyServiceModule.deleteStory(req.params.storyId, req.user);
    return (0, response_1.successResponse)({
        res,
        status: 200,
        message: "Story deleted successfully",
    });
});
exports.default = router;
