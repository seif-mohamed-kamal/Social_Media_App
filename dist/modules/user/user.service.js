"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const service_1 = require("../../common/service");
const repository_1 = require("../../DB/repository");
const token_service_1 = require("../../common/service/token.service");
const domain_exception_1 = require("../../common/exceptions/domain.exception");
const enum_1 = require("../../common/enum");
const security_1 = require("../../common/utils/security");
class userService {
    userModel;
    redis;
    tokenService;
    s3;
    constructor() {
        this.userModel = new repository_1.userRepository();
        this.redis = service_1.redisService;
        this.s3 = service_1.s3Service;
        this.tokenService = new token_service_1.TokenService();
    }
    async profile(user) {
        return user;
    }
    async rotateToken(user, issuer, { jti, iat, sub }) {
        if ((iat + 60 * 60 * 24 * 365) * 1000 >= Date.now() + 5 * 60 * 1000) {
            throw new domain_exception_1.ConflictException("Current access token still valid");
        }
        await this.tokenService.createRevokeToken({
            userId: sub,
            jti,
            ttl: iat + 60 * 60 * 24 * 365,
        });
        return await this.tokenService.createLoginCredentials(user, issuer);
    }
    async logout(flag, user, { jti, iat, sub }) {
        let status = 200;
        switch (flag) {
            case enum_1.logoutEnum.All:
                user.changeCreadintialTime = new Date();
                await user.save();
                const tokenkeys = await this.redis.allKeysByPrefix(this.redis.baseRevokeTokenKey(sub));
                if (tokenkeys.length) {
                    await this.redis.deleteKey(tokenkeys);
                }
                break;
            default:
                await this.tokenService.createRevokeToken({
                    userId: sub,
                    jti,
                    ttl: iat + 60 * 60 * 24 * 365,
                });
                status = 201;
                break;
        }
        return status;
    }
    async updatePassword({ oldPassword, newPassword }, user, issuer) {
        if (!(await (0, security_1.comapareeHash)({
            plainText: oldPassword,
            ciphetText: user.password,
        }))) {
            throw new domain_exception_1.ConflictException("invalid old password");
        }
        user.password = await (0, security_1.generateHash)({ plainText: newPassword });
        user.changeCreadintialTime = new Date();
        await user.save();
        await this.redis.deleteKey(await this.redis.allKeysByPrefix(this.redis.baseRevokeTokenKey(user._id)));
        return await this.tokenService.createLoginCredentials(user, issuer);
    }
    async profileImg({ ContentType, OriginalName, }, user) {
        const oldUrl = user.profilePicture;
        const { url, key } = await this.s3.createPreSignedUploadLink({
            Path: `${user._id.toString()}/profile`,
            OriginalName,
            ContentType,
        });
        user.profilePicture = key;
        if (oldUrl) {
            await this.s3.deleteAsset({ Key: oldUrl });
        }
        await user.save();
        return { user, url };
    }
    async coverImg(files, user) {
        const oldUrls = user.coverPictures;
        const urls = await this.s3.uploadBulkAsset({
            files,
            Path: `${user._id.toString()}/profile/cover`,
        });
        user.coverPictures = urls;
        await user.save();
        if (oldUrls?.length) {
            await this.s3.deleteBulkAsset({
                Keys: oldUrls.map((ele) => ({ Key: ele })),
            });
        }
        return user.toJSON();
    }
    async deleteUser(user) {
        const account = await this.userModel.deleteOne({
            filter: { _id: user._id, force: true },
        });
        if (!account.deletedCount) {
            return new domain_exception_1.NotFoundException("Account already deleted");
        }
        await this.s3.delteFolderByPrefix({ Prefix: `${user._id.toString()}` });
        return account;
    }
}
exports.userService = userService;
exports.default = new userService();
