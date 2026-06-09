"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = void 0;
const mongoose_1 = require("mongoose");
const repository_1 = require("../../DB/repository");
const domain_exception_1 = require("../../common/exceptions/domain.exception");
const chat_enum_1 = require("../../common/enum/chat.enum");
const crypto_1 = require("crypto");
const service_1 = require("../../common/service");
class ChatService {
    chatRepository;
    s3;
    constructor() {
        this.chatRepository = new repository_1.chatRepository();
        this.s3 = service_1.s3Service;
    }
    sayHi = () => {
        return "Done";
    };
    async getChat(participantId, { page, size }, user) {
        const chat = await this.chatRepository.findOneChat({
            filter: {
                participants: {
                    $all: [user._id, mongoose_1.Types.ObjectId.createFromHexString(participantId)],
                },
            },
            options: {
                populate: [{ path: "participants" }],
            },
            page,
            size,
        });
        if (!chat) {
            throw new domain_exception_1.NotFoundException("Fail to find Matching Conversation");
        }
        return chat;
    }
    async sendMessage({ content, sendTo }, user) {
        let chat = await this.chatRepository.findOneAndUpdate({
            filter: {
                participants: {
                    $all: [user._id, mongoose_1.Types.ObjectId.createFromHexString(sendTo)],
                },
            },
            update: {
                $push: {
                    messages: {
                        content: content,
                        createdBy: user._id,
                        createdAt: new Date(),
                    },
                },
            },
            options: {
                returnDocument: "after",
            },
        });
        if (!chat) {
            chat = await this.chatRepository.createOne({
                data: {
                    participants: [user._id, mongoose_1.Types.ObjectId.createFromHexString(sendTo)],
                    createdBy: user._id,
                    messages: {
                        content: content,
                        createdBy: user._id,
                        createdAt: new Date(),
                    },
                    createdAt: new Date(),
                    type: chat_enum_1.chatEnum.ovo,
                },
            });
        }
    }
    async createGroup({ participants = [], group, }, user, file) {
        if (!group) {
            throw new domain_exception_1.BadRequestException("group must have name");
        }
        const uniqueParticipantIds = [
            ...new Set(participants.map((ele) => {
                return mongoose_1.Types.ObjectId.createFromHexString(ele);
            })),
        ];
        if (uniqueParticipantIds.length === 0) {
            throw new domain_exception_1.BadRequestException("Group must include at least one participant");
        }
        const roomId = (0, crypto_1.randomUUID)();
        let groupImg;
        let Path = `chat/group/${roomId}`;
        if (file) {
            groupImg = await this.s3.uploadAsset({
                Path,
                file,
            });
        }
        let chat = await this.chatRepository.createOne({
            data: {
                participants: [...uniqueParticipantIds, user._id],
                createdBy: user._id,
                createdAt: new Date(),
                messages: [],
                group,
                type: chat_enum_1.chatEnum.ovm,
                roomId,
                group_image: groupImg,
            },
        });
        return chat;
    }
    async sendGroupMessage({ content, groupId }, user) {
        let chat = await this.chatRepository.findOneAndUpdate({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                participants: { $in: [user._id] },
                type: chat_enum_1.chatEnum.ovm,
            },
            update: {
                $push: {
                    messages: {
                        content,
                        createdBy: user._id,
                        createdAt: new Date(),
                    },
                },
            },
            options: {
                returnDocument: "after",
            },
        });
        if (!chat) {
            throw new domain_exception_1.NotFoundException("Fail to Find Matching Group ❕");
        }
        return chat.roomId;
    }
    async getChatGroup(groupId, user) {
        const chat = await this.chatRepository.findOneChat({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                participants: { $in: [user._id] },
                type: chat_enum_1.chatEnum.ovm,
            },
            options: {
                populate: [{ path: "participants" }, { path: "messages.createdBy" }],
            },
        });
        if (!chat) {
            throw new domain_exception_1.NotFoundException("Fail to Find Chat");
        }
        return chat.toJSON();
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
