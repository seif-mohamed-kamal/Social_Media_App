import { NextFunction, Request, Response } from "express";
import { ForbiddenException, MapGraphQLError } from "../common/exceptions/domain.exception";
import { RoleEnum } from "../common/enum";
import { HydratedDocument } from "mongoose";
import { IUser } from "../common/interface";

export const authrization = (accessRoles: RoleEnum[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!accessRoles.includes(req.user.role)) {
      throw new ForbiddenException("Not Authorized access");
    }
    next();
  };
};
export const GQLAuthorization = async (
  accessRoles: RoleEnum[],
  user: HydratedDocument<IUser>
): Promise<boolean> => {

  if (!accessRoles.includes(user.role)) {

    throw MapGraphQLError(
      new ForbiddenException("Not authorized account")
    );
  }

  return true;
};