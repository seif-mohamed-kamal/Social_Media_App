"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedException = exports.ForbiddenException = exports.ConflictException = exports.NotFoundException = exports.BadRequestException = exports.MapGraphQLError = void 0;
const graphql_1 = require("graphql");
const application_exception_1 = require("./application.exception");
const MapGraphQLError = (error) => {
    throw new graphql_1.GraphQLError(error.message || "internal server error", {
        extensions: {
            statusCode: error.statusCode,
        },
    });
};
exports.MapGraphQLError = MapGraphQLError;
class BadRequestException extends application_exception_1.ApplicationException {
    constructor(message = "BadRequestException", options) {
        super(message, 400, options);
    }
}
exports.BadRequestException = BadRequestException;
class NotFoundException extends application_exception_1.ApplicationException {
    constructor(message = "NotFoundException", options) {
        super(message, 404, options);
    }
}
exports.NotFoundException = NotFoundException;
class ConflictException extends application_exception_1.ApplicationException {
    constructor(message = "ConflictException", options) {
        super(message, 409, options);
    }
}
exports.ConflictException = ConflictException;
class ForbiddenException extends application_exception_1.ApplicationException {
    constructor(message = "ForbiddenException", options) {
        super(message, 403, options);
    }
}
exports.ForbiddenException = ForbiddenException;
class UnauthorizedException extends application_exception_1.ApplicationException {
    constructor(message = "UnauthorizedException", options) {
        super(message, 401, options);
    }
}
exports.UnauthorizedException = UnauthorizedException;
