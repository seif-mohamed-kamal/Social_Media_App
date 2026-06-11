import multer from "multer";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { fileFiter } from "./validation.multer.js";

export const localFileUpload = ({
  folderName = "general",
  validation = [],
  maxSize = 1,
}: {
  folderName?: string;
  validation?: string[];
  maxSize?: number;
} = {}) => {
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      const filePath = resolve(`uploads/${folderName}`);

      if (!existsSync(filePath)) {
        mkdirSync(filePath, { recursive: true });
      }

      cb(null, filePath);
    },

    filename(req, file, cb) {
      const uniqueName = `${randomUUID()}_${file.originalname}`;

      (file as any).finalPath = `uploads/${folderName}/${uniqueName}`;

      cb(null, uniqueName);
    },
  });

  return multer({
    storage,
    fileFilter: fileFiter(validation),
    limits: {
      fileSize: maxSize * 1024 * 1024,
    },
  });
};