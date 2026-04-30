import multer from "multer";
import { randomUUID } from "node:crypto";
import { fileFiter } from "./validation.multer.js";
import { storageApproachEnum } from "../../enum/multer.enum.js";
import { tmpdir } from "node:os";
import { Request } from "express";
export const cloudUpload = ({
  storageApproch = storageApproachEnum.MEMORY,
  validation = [],
  maxSize = 2,
}: {
  storageApproch?: storageApproachEnum;
  validation?: string[];
  maxSize?: number;
}) => {
  const storage =
    storageApproch == storageApproachEnum.MEMORY
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: function (
            req: Request,
            file: Express.Multer.File,
            callback: (error: Error | null, distination: string) => void
          ) {
            callback(null, tmpdir());
          },

          filename: function (
            req: Request,
            file: Express.Multer.File,
            callback: (error: Error | null, distination: string) => void
          ) {
            let uniqueName = randomUUID() + "_" + file.originalname;
            callback(null, uniqueName);
          },
        });
  return multer({
    fileFilter: fileFiter(validation),
    storage,
    limits: { fileSize: maxSize * 1024 * 1024 },
  });
};
