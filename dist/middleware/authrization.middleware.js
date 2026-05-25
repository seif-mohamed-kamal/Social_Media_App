"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GQLAuthorization = exports.authrization = void 0;
const domain_exception_1 = require("../common/exceptions/domain.exception");
const authrization = (accessRoles) => {
    return async (req, res, next) => {
        if (!accessRoles.includes(req.user.role)) {
            throw new domain_exception_1.ForbiddenException("Not Authorized access");
        }
        next();
    };
};
exports.authrization = authrization;
const GQLAuthorization = async (accessRoles, user) => {
    if (!accessRoles.includes(user.role)) {
        throw (0, domain_exception_1.MapGraphQLError)(new domain_exception_1.ForbiddenException("Not authorized account"));
    }
    return true;
};
exports.GQLAuthorization = GQLAuthorization;
