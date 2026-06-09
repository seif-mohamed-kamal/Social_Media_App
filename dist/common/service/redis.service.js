"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = exports.RedisService = void 0;
const redis_1 = require("redis");
const config_service_1 = require("../../config/config.service");
const enum_1 = require("../enum");
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({ url: config_service_1.REDIS_URI });
        this.handleError();
    }
    handleError() {
        this.client.on("error", (error) => {
            console.log(`Redis Error ---- ${error}`);
        });
        this.client.on("reedy", () => {
            console.log(`Redis Error`);
        });
    }
    async connectToRedis() {
        await this.client.connect();
        console.log("Redis connected successfully👌");
    }
    baseRevokeTokenKey(userId) {
        return `user:RevokeToken:${userId}`;
    }
    resetTokenKey(email) {
        return `user:resetToken:${email}`;
    }
    unconfirmedUser(email) {
        return `${this.baseUnconfirmedUser()}:${email}`;
    }
    baseUnconfirmedUser() {
        return "user:unconfirmedUser";
    }
    revokeTokenKey({ userId, jti, }) {
        return `${this.baseRevokeTokenKey(userId)}:${jti}`;
    }
    redisOtp({ email, subject = enum_1.emailEnum.CONFIRM_EMAIL, }) {
        return `OTP:Code:${email}:${subject}`;
    }
    maxAttemptOtp({ email, subject = enum_1.emailEnum.CONFIRM_EMAIL, }) {
        return `${this.redisOtp({ email, subject })}:maxAttempt`;
    }
    blockUser({ email, subject = enum_1.emailEnum.CONFIRM_EMAIL, }) {
        return `${this.redisOtp({ email, subject })}:blockUser`;
    }
    maxAttemplogin({ email, subject = enum_1.emailEnum.LOGIN_ATTEMPT, }) {
        return `${this.redisOtp({ email, subject })}:maxAttempt`;
    }
    async set({ key, value, ttl, }) {
        try {
            const data = typeof value === "string" ? value : JSON.stringify(value);
            if (ttl && Number.isInteger(ttl)) {
                await this.client.setEx(key, ttl, data);
            }
            else {
                await this.client.set(key, data);
            }
            return true;
        }
        catch (error) {
            console.error("Redis SET error:", error);
            return false;
        }
    }
    async get(key) {
        try {
            const data = await this.client.get(key);
            if (!data)
                return null;
            try {
                return JSON.parse(data);
            }
            catch {
                return data;
            }
        }
        catch (error) {
            console.error("Redis GET error:", error);
            return null;
        }
    }
    async update({ key, value, ttl, }) {
        try {
            const exists = await this.client.exists(key);
            if (!exists)
                return false;
            return await this.set({ key, value, ttl });
        }
        catch (error) {
            console.error("Redis UPDATE error:", error);
            return false;
        }
    }
    async deleteKey(key) {
        try {
            const result = await this.client.del(key);
            return result > 0;
        }
        catch (error) {
            console.error("Redis DELETE error:", error);
            return false;
        }
    }
    async expire({ key, ttl }) {
        try {
            const result = await this.client.expire(key, ttl);
            return result;
        }
        catch (error) {
            console.error("Redis EXPIRE error:", error);
            return false;
        }
    }
    async ttl(key) {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            console.error("Redis TTL error:", error);
            return -2;
        }
    }
    async exists(key) {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            console.error("Redis exists error:", error);
            return -2;
        }
    }
    async incr(key) {
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            console.error("Redis incr error:", error);
            return -2;
        }
    }
    async allKeysByPrefix(baseKey) {
        return await this.client.keys(`${baseKey}*`);
    }
    async FCM_KEY(userId) {
        return `user:FCM:${userId}`;
    }
    async addFCM(userId, FCMToken) {
        return await this.client.sAdd(await this.FCM_KEY(userId), FCMToken);
    }
    async removeFCM(userId, FCMToken) {
        return await this.client.sRem(await this.FCM_KEY(userId), FCMToken);
    }
    async getFCMs(userId) {
        return await this.client.sMembers(await this.FCM_KEY(userId));
    }
    async hasFCMs(userId) {
        return await this.client.sCard(await this.FCM_KEY(userId));
    }
    async removeFCMUser(userId) {
        return await this.client.del(await this.FCM_KEY(userId));
    }
    socketKey(userId) {
        return `user:sockets:${userId}`;
    }
    async addSocket(userId, socketId) {
        return await this.client.sAdd(this.socketKey(userId), socketId);
    }
    async removeSocket(userId, socketId) {
        return await this.client.sRem(this.socketKey(userId), socketId);
    }
    async getSockets(userId) {
        return await this.client.sMembers(this.socketKey(userId));
    }
    async hasSockets(userId) {
        return await this.client.sCard(this.socketKey(userId));
    }
    async removeUser(userId) {
        return await this.client.del(this.socketKey(userId));
    }
}
exports.RedisService = RedisService;
exports.redisService = new RedisService();
