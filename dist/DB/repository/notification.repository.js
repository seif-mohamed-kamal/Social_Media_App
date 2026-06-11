"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRepository = void 0;
const model_1 = require("../model");
const DB_repository_1 = require("./DB.repository");
class notificationRepository extends DB_repository_1.DataBaseRepository {
    constructor() {
        super(model_1.notificationModel);
    }
}
exports.notificationRepository = notificationRepository;
