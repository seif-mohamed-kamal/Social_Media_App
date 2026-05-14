"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentRepository = void 0;
const model_1 = require("../model");
const DB_repository_1 = require("./DB.repository");
class commentRepository extends DB_repository_1.DataBaseRepository {
    constructor() {
        super(model_1.commentModel);
    }
}
exports.commentRepository = commentRepository;
