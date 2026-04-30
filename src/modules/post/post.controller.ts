import { NextFunction, Request, Response, Router } from "express";
import { authintication } from "../../middleware";
import { cloudUpload, fileExtention } from "../../common/utils/multer";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./post.validation";
import { successResponse } from "../../common/response";
import postService from "./post.service";
const router = Router();

router.post(
  "/create",
  authintication(),
  cloudUpload({
    validation: fileExtention.image,
  }).array("files", 2),
  validation(validators.createPostSchema),
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const result = await postService.createPost(
      { ...req.body, files: req.files },
      req.user
    );
    return successResponse({ res, status: 201, result });
  }
);

export default router;
