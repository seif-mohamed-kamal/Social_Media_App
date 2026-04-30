import { z } from "zod";
import { createPostSchema } from "./post.validation";

export type createPostDtoBody = z.infer<typeof createPostSchema.body>;
