import { z } from "zod";
import { createPostSchema, deletePostSchema, reactPostSchema, updatePostSchema } from "./post.validation";

export type createPostDtoBody = z.infer<typeof createPostSchema.body>;
export type reactPostQuetyDTO = z.infer<typeof reactPostSchema.query>;
export type reactPostParamsDTO = z.infer<typeof reactPostSchema.params>;
export type updatePostDTOParams = z.infer<typeof updatePostSchema.params>;
export type deletePostDTOParams = z.infer<typeof deletePostSchema.params>;
