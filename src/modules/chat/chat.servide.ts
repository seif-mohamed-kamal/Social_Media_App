import { HydratedDocument, Types } from "mongoose";
import { IChat, IUser } from "../../common/interface";
import { chatRepository } from "../../DB/repository";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/exceptions/domain.exception";
import { chatEnum } from "../../common/enum/chat.enum";
import { randomUUID } from "crypto";
import { s3Service, S3Service } from "../../common/service";

export class ChatService {
  private chatRepository: chatRepository;
  private readonly s3: S3Service;
  constructor() {
    this.chatRepository = new chatRepository();
    this.s3 = s3Service;
  }

  sayHi = () => {
    return "Done";
  };

  async getChat(
    participantId: string,
    { page, size }: { page: string; size: string },
    user: HydratedDocument<IUser>
  ): Promise<IChat> {
    const chat = await this.chatRepository.findOneChat({
      filter: {
        participants: {
          $all: [user._id, Types.ObjectId.createFromHexString(participantId)],
        },
      },
      options: {
        populate: [{ path: "participants" }],
      },
      page,
      size,
    });
    if (!chat) {
      throw new NotFoundException("Fail to find Matching Conversation");
    }
    return chat;
  }

  async sendMessage(
    { content, sendTo }: { content: string; sendTo: string },
    user: HydratedDocument<IUser>
  ): Promise<void> {
    let chat = await this.chatRepository.findOneAndUpdate({
      filter: {
        participants: {
          $all: [user._id, Types.ObjectId.createFromHexString(sendTo)],
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
          participants: [user._id, Types.ObjectId.createFromHexString(sendTo)],
          createdBy: user._id,
          messages: {
            content: content,
            createdBy: user._id,
            createdAt: new Date(),
          },
          createdAt: new Date(),
          type: chatEnum.ovo,
        },
      });
    }
  }

  async createGroup(
    {
      participants = [],
      group,
    }: { participants: string[] | Types.ObjectId[]; group: string },
    user: HydratedDocument<IUser>,
    file: Express.Multer.File
  ): Promise<IChat> {
    if (!group) {
      throw new BadRequestException("group must have name");
    }
    const uniqueParticipantIds = [
      ...new Set(
        participants.map((ele) => {
          return Types.ObjectId.createFromHexString(ele as string);
        })
      ),
    ];
    if (uniqueParticipantIds.length === 0) {
      throw new BadRequestException(
        "Group must include at least one participant"
      );
    }
    const roomId = randomUUID();
    let groupImg!: string;
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
        type: chatEnum.ovm,
        roomId,
        group_image: groupImg,
      },
    });
    return chat;
  }

  async sendGroupMessage(
    { content, groupId }: { groupId: string; content: string },
    user: HydratedDocument<IUser>
  ): Promise<string> {
    let chat = await this.chatRepository.findOneAndUpdate({
      filter: {
        _id: Types.ObjectId.createFromHexString(groupId),
        participants: { $in: [user._id] },
        type: chatEnum.ovm,
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
      throw new NotFoundException("Fail to Find Matching Group ❕");
    }
    return chat.roomId as string;
  }

  async getChatGroup(
    groupId: string,
    
    user: HydratedDocument<IUser>
  ): Promise<IChat> {
    const chat = await this.chatRepository.findOneChat({

      filter: {
        _id: Types.ObjectId.createFromHexString(groupId),
        participants: { $in: [user._id] },
        type: chatEnum.ovm,
      },
      options: {
        populate: [{ path: "participants" }, { path: "messages.createdBy" }],
      },
    });

    if (!chat) {
      throw new NotFoundException("Fail to Find Chat");
    }
    return chat.toJSON();
  }
}

export const chatService = new ChatService();
