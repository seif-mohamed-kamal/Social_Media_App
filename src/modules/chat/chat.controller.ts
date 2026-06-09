import { Router } from "express";
import { authintication } from "../../middleware";
import { successResponse } from "../../common/response";
import { chatService } from "./chat.servide";
import { cloudUpload, fileExtention } from "../../common/utils/multer";
const router = Router({ mergeParams: true });
router.get("/", authintication(), async (req, res, next) => {
  try {
    const chat = await chatService.getChat(
      req.params.userId as string,
      req.query as unknown as { page: string; size: string },
      req.user
    );

    return successResponse({ res, result: { chat } });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/group",
  authintication(),
  cloudUpload({
    // storageApproch:storageApproachEnum.DISK,
    validation: fileExtention.image,
  }).single("file"),
  async (req, res, next) => {
    try {
      const chat = await chatService.createGroup(
        req.body,
        req.user,
        req.file as Express.Multer.File
      );

      return successResponse({ res, result: { chat } });
    } catch (error) {
      return next(error);
    }
  }
);

router.get("/group/:groupId", authintication(), async (req, res, next) => {
  try {
    let groupId = req.params["groupId"];
    const chat = await chatService.getChatGroup(
      groupId as string,
      req.user
    );
    return successResponse({ res, status: 201, result: { chat } });
  } catch (error) {
    console.error("OVM CHAT ERROR:", error);
    return next(error);
  }
});

export default router;
