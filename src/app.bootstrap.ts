import express, { NextFunction, Request, Response } from "express";
import {
  authRouter,
  notificationRouter,
  schema,
  stroyRouter,
  userRouter,
} from "./modules";
import { authintication, globalErrorHandling } from "./middleware";
import { port } from "./config/config.service";
import { connectToDB } from "./DB";
import { notificationService, redisService, s3Service } from "./common/service";
import { promisify } from "node:util";
import { pipeline } from "node:stream";
const writePipeLine = promisify(pipeline);
import cors from "cors";
import { successResponse } from "./common/response";
import { postRouter } from "./modules/post";
import { createHandler } from "graphql-http/lib/use/express";
import { realtimeGateway } from "./modules/realTime";
import { chatRouter } from "./modules/chat";

const bootstrap = async () => {
  const app: express.Express = express();

  app.use(cors(), express.json());

  //DB
  await connectToDB();
  await redisService.connectToRedis();

  //Routes
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/post", postRouter);
  app.use("/chat", chatRouter);
  app.use("/notification", notificationRouter);
  app.use("/story", stroyRouter);
  app.all(
    "/graphql",
    authintication(),
    createHandler({
      schema: schema,
      context: (req) => ({ user: req.raw.user, decoded: req.raw.decoded }),
    })
  );

  //view picture & download
  app.get(
    "/upload/*path",
    async (req: Request, res: Response, next: NextFunction) => {
      const { download, fileName } = req.query as {
        download: string;
        fileName: string;
      };
      const { path } = req.params as { path: string[] };
      const Key = path.join("/");
      const { Body, ContentType } = await s3Service.getAsset({ Key });
      // console.log({ Body, ContentType });
      res.setHeader("Content-Type", ContentType || "application/octet-stream");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      if (download === "true") {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName || Key.split("/").pop()}"`
        );
      }
      return await writePipeLine(Body as NodeJS.ReadableStream, res);
    }
  );

  app.get(
    "/pre-signed/*path",
    async (req: Request, res: Response, next: NextFunction) => {
      const { download, fileName } = req.query as {
        download: string;
        fileName: string;
      };
      const { path } = req.params as { path: string[] };
      const Key = path.join("/");
      const url = await s3Service.createPreSignedFetchLink({
        Key,
        download,
        fileName,
      });
      return successResponse({ res, result: { url } });
    }
  );

  //notification
  app.post(
    "/send-notification",
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.log({ token: req.body.token });
      await notificationService.sendNotification({
        token: req.body.token,
        data: {
          title: "hello",
          body: "welcome",
        },
      });
      return res.json({ message: "hello from notification" });
    }
  );

  app.get(
    "/",
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      res.status(200).json({ message: "Landing Page" });
    }
  );

  app.use(globalErrorHandling);
  const httpServer = app.listen(port, () => {
    console.log(`Server is running on port ${port} 🚀`);
  });

  //Initialize Socket.io
  await realtimeGateway.initializeIo(httpServer);
};

export default bootstrap;
