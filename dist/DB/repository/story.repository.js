"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyRepository = void 0;
const model_1 = require("../model");
const DB_repository_1 = require("./DB.repository");
class storyRepository extends DB_repository_1.DataBaseRepository {
    constructor() {
        super(model_1.StoryModel);
    }
}
exports.storyRepository = storyRepository;
