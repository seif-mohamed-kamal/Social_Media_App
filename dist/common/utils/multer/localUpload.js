"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.localFileUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_crypto_1 = require("node:crypto");
const validation_multer_js_1 = require("./validation.multer.js");
const localFileUpload = ({ folderName = "general", validation = [], maxSize = 1, } = {}) => {
    const storage = multer_1.default.diskStorage({
        destination(req, file, cb) {
            const filePath = (0, node_path_1.resolve)(`uploads/${folderName}`);
            if (!(0, node_fs_1.existsSync)(filePath)) {
                (0, node_fs_1.mkdirSync)(filePath, { recursive: true });
            }
            cb(null, filePath);
        },
        filename(req, file, cb) {
            const uniqueName = `${(0, node_crypto_1.randomUUID)()}_${file.originalname}`;
            file.finalPath = `uploads/${folderName}/${uniqueName}`;
            cb(null, uniqueName);
        },
    });
    return (0, multer_1.default)({
        storage,
        fileFilter: (0, validation_multer_js_1.fileFiter)(validation),
        limits: {
            fileSize: maxSize * 1024 * 1024,
        },
    });
};
exports.localFileUpload = localFileUpload;
