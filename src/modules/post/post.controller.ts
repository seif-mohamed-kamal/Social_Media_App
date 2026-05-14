import { NextFunction, Request, Response, Router } from "express";
import { authintication } from "../../middleware";
import { cloudUpload, fileExtention } from "../../common/utils/multer";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./post.validation";
import { successResponse } from "../../common/response";
import postService from "./post.service";
import { paginateDTO, paginationValidationSchmea } from "../../common/validation";
import { reactPostParamsDTO, reactPostQuetyDTO, updatePostDTOParams } from "./post.dto";
import { commentRouter } from "../comment";
import { deleteCommentDtoParams } from "../comment/comment.dto";
const router = Router();
router.use("/:postId/comment" , commentRouter)
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

router.get(
  "/",
  authintication(),
  validation(paginationValidationSchmea),
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const result = await postService.listPosts(req.query as paginateDTO , req.user);
    return successResponse({ res, status: 200, result });
  }
);

router.patch(
  "/:postId/react",
  authintication(),
  validation(validators.reactPostSchema),
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const result = await postService.reactPost(req.params as reactPostParamsDTO , req.query as unknown as reactPostQuetyDTO, req.user);
    return successResponse({ res, status: 200, result });
  }
);

router.delete(
  "/:postId",
  authintication(),
  validation(validators.deletePostSchema),
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const result = await postService.deletepost(
      req.params as deleteCommentDtoParams ,
      req.user
    );
    return successResponse({ res, status: 204, result });
  }
);

router.patch(
  "/:postId",
  authintication(),
  cloudUpload({
    validation: fileExtention.image,
  }).array("files", 2),
  validation(validators.updatePostSchema),
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const result = await postService.updatePost(
      req.params as updatePostDTOParams ,
      { ...req.body, files: req.files },
      req.user
    );
    return successResponse({ res, status: 201, result });
  }
);


export default router;
