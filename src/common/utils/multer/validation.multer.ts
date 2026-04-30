import { Request } from "express";
import multer from "multer";
import { BadRequestException } from "../../exceptions/domain.exception";
export const fileExtention = {
  image: ["image/png", "image/jpg", "image/jpeg"],
  video: ["/video/mp4"],
};

export const fileFiter = (validation: string[]) => {
  return function (
    req: Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback
  ) {
    if (!validation.includes(file.mimetype)) {
      return callback(new BadRequestException("Invalid File Format"));
    }
    return callback(null, true);
  };
};
