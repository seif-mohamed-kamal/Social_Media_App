"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userResolver = exports.UserResolver = void 0;
const middleware_1 = require("../../../middleware");
const validation_middleware_1 = require("../../../middleware/validation.middleware");
const user_authrization_1 = require("../user.authrization");
const user_service_1 = require("../user.service");
const user_validation_1 = require("../user.validation");
class UserResolver {
    service;
    constructor() {
        this.service = new user_service_1.userService();
    }
    profile = async (parent, args, { user }) => {
        if (!user) {
            throw new Error("Unauthorized");
        }
        await (0, middleware_1.GQLAuthorization)(user_authrization_1.endpoints.profile, user);
        await (0, validation_middleware_1.GQLValidation)(user_validation_1.profileGQL, args);
        const data = await this.service.profile(user);
        return {
            message: "hi",
            data,
        };
    };
}
exports.UserResolver = UserResolver;
exports.userResolver = new UserResolver();
