"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const modules_1 = require("./modules");
const middleware_1 = require("./middleware");
const config_service_1 = require("./config/config.service");
const DB_1 = require("./DB");
const service_1 = require("./common/service");
const node_util_1 = require("node:util");
const node_stream_1 = require("node:stream");
const writePipeLine = (0, node_util_1.promisify)(node_stream_1.pipeline);
const cors_1 = __importDefault(require("cors"));
const response_1 = require("./common/response");
const post_1 = require("./modules/post");
const express_2 = require("graphql-http/lib/use/express");
const realTime_1 = require("./modules/realTime");
const chat_1 = require("./modules/chat");
const bootstrap = async () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)(), express_1.default.json());
    await (0, DB_1.connectToDB)();
    await service_1.redisService.connectToRedis();
    app.use("/auth", modules_1.authRouter);
    app.use("/user", modules_1.userRouter);
    app.use("/post", post_1.postRouter);
    app.use("/chat", chat_1.chatRouter);
    app.use("/notification", modules_1.notificationRouter);
    app.use("/story", modules_1.stroyRouter);
    app.all("/graphql", (0, middleware_1.authintication)(), (0, express_2.createHandler)({
        schema: modules_1.schema,
        context: (req) => ({ user: req.raw.user, decoded: req.raw.decoded }),
    }));
    app.get("/upload/*path", async (req, res, next) => {
        const { download, fileName } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const { Body, ContentType } = await service_1.s3Service.getAsset({ Key });
        res.setHeader("Content-Type", ContentType || "application/octet-stream");
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        if (download === "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${fileName || Key.split("/").pop()}"`);
        }
        return await writePipeLine(Body, res);
    });
    app.get("/pre-signed/*path", async (req, res, next) => {
        const { download, fileName } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const url = await service_1.s3Service.createPreSignedFetchLink({
            Key,
            download,
            fileName,
        });
        return (0, response_1.successResponse)({ res, result: { url } });
    });
    app.post("/send-notification", async (req, res, next) => {
        console.log({ token: req.body.token });
        await service_1.notificationService.sendNotification({
            token: req.body.token,
            data: {
                title: "hello",
                body: "welcome",
            },
        });
        return res.json({ message: "hello from notification" });
    });
    app.get("/", (req, res, next) => {
        res.status(200).json({ message: "Landing Page" });
    });
    app.use(middleware_1.globalErrorHandling);
    const httpServer = app.listen(config_service_1.port, () => {
        console.log(`Server is running on port ${config_service_1.port} 🚀`);
    });
    await realTime_1.realtimeGateway.initializeIo(httpServer);
};
exports.default = bootstrap;
