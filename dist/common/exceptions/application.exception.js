"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationException = void 0;
class ApplicationException extends Error {
    statusCode;
    options;
    constructor(message, statusCode, options) {
        super(message, options);
        this.statusCode = statusCode;
        this.options = options;
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.options = options;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApplicationException = ApplicationException;
