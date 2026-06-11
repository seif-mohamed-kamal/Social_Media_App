import { NextFunction, Request, Response, Router } from "express";
import { authintication } from "../../middleware";
import { successResponse } from "../../common/response";
import { storyServiceModule } from "./story.service";
import { fileExtention, localFileUpload } from "../../common/utils/multer";

const router = Router();

router.post(
  "/",
  authintication(),
  localFileUpload({
    folderName: "stories",
    validation: fileExtention.image,
  }).single("file"),
  async (req, res, next) => {
    const result = await storyServiceModule.createStory(
      req.body,
      req.user,
      req.file
    );
    return successResponse({
      res,
      status: 201,
      result,
    });
  }
);

router.get(
  "/my",
  authintication(),
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await storyServiceModule.getMyStories(req.user);
    return successResponse({
      res,
      status: 200,
      result,
    });
  }
);

router.get(
  "/:storyId",
  authintication(),
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await storyServiceModule.getStoryById(
      req.params.storyId as string,
      req.user
    );

    return successResponse({
      res,
      status: 200,
      result,
    });
  }
);

router.patch(
  "/:storyId",
  authintication(),
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await storyServiceModule.updateStory(
      req.params.storyId as string,
      req.body,
      req.user
    );

    return successResponse({
      res,
      status: 200,
      result,
    });
  }
);

router.delete(
  "/:storyId",
  authintication(),
  async (req: Request, res: Response, next: NextFunction) => {
    await storyServiceModule.deleteStory(
      req.params.storyId as string,
      req.user
    );

    return successResponse({
      res,
      status: 200,
      message: "Story deleted successfully",
    });
  }
);

export default router;
