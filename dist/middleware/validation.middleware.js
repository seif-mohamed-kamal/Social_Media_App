"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GQLValidation = exports.validation = void 0;
const domain_exception_1 = require("../common/exceptions/domain.exception");
const validation = (schema) => {
    return (req, res, next) => {
        const issues = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            if (req.file) {
                req.body.file = req.file;
            }
            if (req.files) {
                req.body.files = req.files;
            }
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const error = validationResult.error;
                issues.push({
                    key,
                    issues: error.issues.map((issue) => {
                        return { path: issue.path, message: issue.message };
                    }),
                });
            }
        }
        if (issues.length) {
            throw new domain_exception_1.BadRequestException("validation Error", { cause: issues });
        }
        next();
    };
};
exports.validation = validation;
const GQLValidation = async (schema, args) => {
    const validationResult = schema.safeParse(args);
    if (!validationResult.success) {
        const formattedIssues = validationResult.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
        }));
        throw (0, domain_exception_1.MapGraphQLError)(new domain_exception_1.BadRequestException("Validation Error", {
            cause: formattedIssues,
        }));
    }
    return true;
};
exports.GQLValidation = GQLValidation;
