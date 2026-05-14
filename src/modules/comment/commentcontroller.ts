import { NextFunction, Request, Response, Router } from "express";
import { authintication } from "../../middleware";
import { cloudUpload, fileExtention } from "../../common/utils/multer";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./comment.validation";
import { successResponse } from "../../common/response";
import { createCommentDtoParams, createReplyCommentDtoParams } from "./comment.dto";
import commentService from "./comment.service";
const router = Router({mergeParams:true});

router.post(
  "/",
  authintication(),
  cloudUpload({
    validation: fileExtention.image,
  }).array("files", 2),
  validation(validators.createCommentSchema),
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const result = await commentService.createComment(
      req.params as createCommentDtoParams ,
      { ...req.body, files: req.files },
      req.user
    );
    return successResponse({ res, status: 201, result });
  }
);


router.post(
  "/:commentId/reply",
  authintication(),
  cloudUpload({
    validation: fileExtention.image,
  }).array("files", 2),
  validation(validators.createReplyCommentSchema),
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const result = await commentService.replyOnComment(
      req.params as createReplyCommentDtoParams ,
      { ...req.body, files: req.files },
      req.user
    );
    return successResponse({ res, status: 201, result });
  }
);

router.delete(
  "/:commentId",
  authintication(),
  validation(validators.deleteCommentSchema),
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const result = await commentService.deleteComment(
      req.params as createReplyCommentDtoParams ,
      req.user
    );
    return successResponse({ res, status: 201, result });
  }
);

router.patch(
  "/:commentId",
  authintication(),
  cloudUpload({
    validation: fileExtention.image,
  }).array("files", 2),
  validation(validators.createReplyCommentSchema),
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const result = await commentService.updateComment(
      req.params as createReplyCommentDtoParams ,
      { ...req.body, files: req.files },
      req.user
    );
    return successResponse({ res, status: 201, result });
  }
);

export default router;
