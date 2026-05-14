import { z } from "zod";
import { createCommentSchema, createReplyCommentSchema, updateCommentSchema, deleteCommentSchema } from "./comment.validation";

export type createCommentDtoBody = z.infer<typeof createCommentSchema.body>;
export type createCommentDtoParams = z.infer<typeof createCommentSchema.params>;
export type createReplyCommentDtoParams = z.infer<typeof createReplyCommentSchema.params>;
export type updateCommentDtoParams = z.infer<typeof updateCommentSchema.params>;
export type deleteCommentDtoParams = z.infer<typeof deleteCommentSchema.params>;
