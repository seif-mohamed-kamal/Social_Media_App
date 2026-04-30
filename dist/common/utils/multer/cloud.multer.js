"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const node_crypto_1 = require("node:crypto");
const validation_multer_js_1 = require("./validation.multer.js");
const multer_enum_js_1 = require("../../enum/multer.enum.js");
const node_os_1 = require("node:os");
const cloudUpload = ({ storageApproch = multer_enum_js_1.storageApproachEnum.MEMORY, validation = [], maxSize = 2, }) => {
    const storage = storageApproch == multer_enum_js_1.storageApproachEnum.MEMORY
        ? multer_1.default.memoryStorage()
        : multer_1.default.diskStorage({
            destination: function (req, file, callback) {
                callback(null, (0, node_os_1.tmpdir)());
            },
            filename: function (req, file, callback) {
                let uniqueName = (0, node_crypto_1.randomUUID)() + "_" + file.originalname;
                callback(null, uniqueName);
            },
        });
    return (0, multer_1.default)({
        fileFilter: (0, validation_multer_js_1.fileFiter)(validation),
        storage,
        limits: { fileSize: maxSize * 1024 * 1024 },
    });
};
exports.cloudUpload = cloudUpload;
