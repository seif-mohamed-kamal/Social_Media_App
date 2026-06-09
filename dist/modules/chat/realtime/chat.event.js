"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatEvent = exports.ChatEvent = void 0;
const validation_middleware_1 = require("../../../middleware/validation.middleware");
const chat_servide_1 = require("../chat.servide");
const validators = __importStar(require("../chat.validation"));
const service_1 = require("../../../common/service");
class ChatEvent {
    chatService;
    redis;
    constructor() {
        this.redis = service_1.redisService;
        this.chatService = new chat_servide_1.ChatService();
    }
    sayHi = (socket) => {
        return socket.on("sayHi", async (data) => {
            try {
                await (0, validation_middleware_1.socketValidation)(validators.sayHi, data);
                const result = this.chatService.sayHi();
                socket.emit("sayHiBack", { message: result, timestamp: new Date() });
            }
            catch (error) {
                socket.emit("sayHiBack", "validation error");
            }
        });
    };
    sendMessage = (socket, io) => {
        return socket.on("sendMessage", async ({ content, sendTo }) => {
            try {
                await this.chatService.sendMessage({ content, sendTo }, socket.data.user);
                io.to(await this.redis.getSockets(socket.data.user._id.toString())).emit("successMessage", { content, sendTo });
                const recieverSocketIDs = await this.redis.getSockets(sendTo);
                if (recieverSocketIDs.length) {
                    socket
                        .to(recieverSocketIDs)
                        .emit("newMessage", { content, sendTo });
                }
            }
            catch (error) {
                socket.emit("custom_error", error);
            }
        });
    };
    sendGroupMessage = (socket) => {
        return socket.on("sendGroupMessage", async ({ content, groupId }) => {
            try {
                const roomId = await this.chatService.sendGroupMessage({ content, groupId }, socket.data.user);
                const io = socket.server;
                io.to(await this.redis.getSockets(socket.data.user._id.toString())).emit("successMessage", { content, sendTo: groupId });
                socket.to(roomId).emit("newMessage", { content, groupId });
            }
            catch (error) {
                socket.emit("custom_error", error);
            }
        });
    };
    joinRoom = (socket) => {
        return socket.on("join_room", async ({ roomId }) => {
            try {
                socket.join(roomId);
            }
            catch (error) {
                socket.emit("custom_error", error);
            }
        });
    };
}
exports.ChatEvent = ChatEvent;
exports.chatEvent = new ChatEvent();
