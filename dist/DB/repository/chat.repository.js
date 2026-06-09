"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRepository = void 0;
const model_1 = require("../model");
const DB_repository_1 = require("./DB.repository");
class chatRepository extends DB_repository_1.DataBaseRepository {
    constructor() {
        super(model_1.chatModel);
    }
    async findOneChat({ filter, projection, options, page = "1", size = "5", }) {
        const pageNum = parseInt(page);
        const sizeNum = parseInt(size);
        let query = this.model.findOne(filter, { messages: { $slice: [-pageNum * sizeNum, sizeNum] } });
        if (options?.populate) {
            query = query.populate(options.populate);
        }
        if (options?.lean !== undefined) {
            query = query.lean(options.lean);
        }
        return await query.exec();
    }
}
exports.chatRepository = chatRepository;
