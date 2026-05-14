"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBaseRepository = void 0;
class DataBaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, option, }) {
        return await this.model.create(data, option);
    }
    async createOne({ data, option, }) {
        const [doc] = (await this.create({ data: [data], option })) || [];
        return doc;
    }
    async findOne({ filter, projection, options, }) {
        const doc = this.model.findOne(filter, projection);
        if (options?.lean)
            doc.lean(options.lean);
        return await doc.exec();
    }
    async find({ filter, projection, options, }) {
        const doc = this.model.find(filter, projection);
        if (options?.lean)
            doc.lean(options.lean);
        if (options?.limit)
            doc.limit(options.limit);
        if (options?.skip)
            doc.skip(options.skip);
        if (options?.populate)
            doc.populate(options.populate);
        return await doc.exec();
    }
    async paginate({ filter, projection, options = {}, page = 0, size = 5, }) {
        let count = -1;
        if (Number(page) > 0) {
            page = parseInt(page);
            size = parseInt(size);
            options.skip = (page - 1) * size;
            options.limit = size;
            count = await this.model.countDocuments(filter || {});
        }
        const docs = await this.find({
            filter: filter || {},
            projection,
            options,
        });
        return {
            docs,
            ...(Number(page) > 0
                ? {
                    currentPage: page,
                    size,
                    pages: Math.ceil(count / size),
                }
                : {}),
        };
    }
    async findById({ _id, projection, options, }) {
        const doc = this.model.findOne(_id, projection);
        if (options?.lean)
            doc.lean(options.lean);
        return await doc.exec();
    }
    async updateOne({ filter, update, options, }) {
        return this.model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async findOneAndUpdate({ filter, update, options = { new: true }, }) {
        return this.model.findOneAndUpdate(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async findByIdAndUpdate({ _id, update, options = { new: true }, }) {
        return this.model.findByIdAndUpdate(_id, { ...update, $inc: { __v: 1 } }, options);
    }
    async updateMany({ filter, update, options, }) {
        return this.model.updateMany(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async deleteOne({ filter, }) {
        return this.model.deleteOne(filter);
    }
    async findOneAndDelete({ filter, }) {
        return this.model.findOneAndDelete(filter);
    }
    async findByIdAndDelete({ _id, }) {
        return this.model.findByIdAndDelete(_id);
    }
    async deleteMany({ filter, }) {
        return this.model.deleteMany(filter);
    }
}
exports.DataBaseRepository = DataBaseRepository;
