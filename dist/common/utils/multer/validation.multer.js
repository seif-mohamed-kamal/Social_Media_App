"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileFiter = exports.fileExtention = void 0;
const domain_exception_1 = require("../../exceptions/domain.exception");
exports.fileExtention = {
    image: ["image/png", "image/jpg", "image/jpeg"],
    video: ["/video/mp4"],
};
const fileFiter = (validation) => {
    return function (req, file, callback) {
        if (!validation.includes(file.mimetype)) {
            return callback(new domain_exception_1.BadRequestException("Invalid File Format"));
        }
        return callback(null, true);
    };
};
exports.fileFiter = fileFiter;
