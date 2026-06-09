import { Server } from "socket.io";
import { IAuthSocket } from "../../../common/types/express.types";
import { socketValidation } from "../../../middleware/validation.middleware";
import { ChatService } from "../chat.servide";
import * as validators from "../chat.validation";
import { RedisService, redisService } from "../../../common/service";

export class ChatEvent {
  private chatService: ChatService;
  private readonly redis: RedisService;

  constructor() {
    this.redis = redisService;
    this.chatService = new ChatService();
  }

  sayHi = (socket: IAuthSocket) => {
    return socket.on("sayHi", async (data: { name: string }) => {
      try {
        await socketValidation<{ name: string }>(validators.sayHi, data);
        // console.log({ data });
        const result = this.chatService.sayHi();
        socket.emit("sayHiBack", { message: result, timestamp: new Date() });
      } catch (error) {
        socket.emit("sayHiBack", "validation error");
      }
    });
  };
  sendMessage = (socket: IAuthSocket, io: Server) => {
    return socket.on(
      "sendMessage",
      async ({ content, sendTo }: { content: string; sendTo: string }) => {
        try {
          // console.log({content , sendTo})
          await this.chatService.sendMessage(
            { content, sendTo },
            socket.data.user
          );
          io.to(
            await this.redis.getSockets(socket.data.user._id.toString())
          ).emit("successMessage", { content, sendTo });
          const recieverSocketIDs = await this.redis.getSockets(sendTo);
          if (recieverSocketIDs.length) {
            socket
              .to(recieverSocketIDs)
              .emit("newMessage", { content, sendTo });
          }
        } catch (error) {
          socket.emit("custom_error", error);
        }
      }
    );
  };

  sendGroupMessage = (socket: IAuthSocket) => {
    return socket.on("sendGroupMessage", async ({ content, groupId }) => {
      try {
        const roomId = await this.chatService.sendGroupMessage(
          { content, groupId },
          socket.data.user
        );
        const io: Server = (socket as any).server;

        io.to(
          await this.redis.getSockets(socket.data.user._id.toString())
        ).emit("successMessage", { content, sendTo: groupId });

        socket.to(roomId).emit("newMessage", { content, groupId });
      } catch (error) {
        socket.emit("custom_error", error);
      }
    });
  };
  joinRoom = (socket: IAuthSocket) => {
    return socket.on("join_room", async ({ roomId }: { roomId: string }) => {
      try {
        socket.join(roomId);
      } catch (error) {
        socket.emit("custom_error", error);
      }
    });
  };
}
export const chatEvent = new ChatEvent();
