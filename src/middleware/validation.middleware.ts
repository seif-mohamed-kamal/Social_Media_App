import { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";
import {
  BadRequestException,
  MapGraphQLError,
} from "../common/exceptions/domain.exception";

type keyReqType = keyof Request;
type schemaType = Partial<Record<keyReqType, ZodType>>;
type issueType = Array<{
  key: keyReqType;
  issues: Array<{
    message: string;
    path: Array<symbol | number | string | undefined | null>;
  }>;
}>;

export const validation = (schema: schemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const issues: issueType = [];
    for (const key of Object.keys(schema) as keyReqType[]) {
      if (!schema[key]) continue;
      if (req.file) {
        req.body.file = req.file;
      }
      if (req.files) {
        // console.log(req.files)
        req.body.files = req.files;
      }
      const validationResult = schema[key].safeParse(req[key]);
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        issues.push({
          key,
          issues: error.issues.map((issue) => {
            return { path: issue.path, message: issue.message };
          }),
        });
      }
    }
    if (issues.length) {
      throw new BadRequestException("validation Error", { cause: issues });
    }
    next();
  };
};

export const GQLValidation = async <T>(
  schema: ZodType,
  args: T
): Promise<boolean> => {
  const validationResult = schema.safeParse(args);

  if (!validationResult.success) {
    const formattedIssues = validationResult.error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
    }));

    throw MapGraphQLError(
      new BadRequestException("Validation Error", {
        cause: formattedIssues,
      })
    );
  }

  return true;
};
