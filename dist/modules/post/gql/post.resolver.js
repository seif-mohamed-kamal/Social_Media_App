"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postResolver = exports.PostResolver = void 0;
const post_service_1 = require("../post.service");
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
const validation_middleware_1 = require("../../../middleware/validation.middleware");
const validation_1 = require("../../../common/validation");
const post_validation_1 = require("../post.validation");
class PostResolver {
    postService;
    constructor() {
        this.postService = new post_service_1.PostService();
    }
    postList = async (parent, args, { user }) => {
        if (!user) {
            throw new domain_exception_1.UnauthorizedException("unAuthrized user");
        }
        await (0, validation_middleware_1.GQLValidation)(validation_1.paginationValidationSchmea.query, args);
        const data = await this.postService.listPosts(args, user);
        return { message: "Done", data };
    };
    reactOnPost = async (parent, { postId, react }, { user }) => {
        await (0, validation_middleware_1.GQLValidation)(post_validation_1.reactOnPostGQL, { postId, react });
        const data = await this.postService.reactPost({ postId }, { react }, user);
        return {
            message: "Done",
            data,
        };
    };
}
exports.PostResolver = PostResolver;
exports.postResolver = new PostResolver();
