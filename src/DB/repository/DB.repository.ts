import {
  AnyKeys,
  CreateOptions,
  DeleteResult,
  FlattenMaps,
  HydratedDocument,
  Model,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  ReturnsNewDoc,
  Types,
  UpdateQuery,
  UpdateResult,
  UpdateWithAggregationPipeline,
  
} from "mongoose";
import { IPaginate } from "../../common/interface";
export abstract class DataBaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  //Create OverLoading
  async create({ data }: { data: AnyKeys<T> }): Promise<HydratedDocument<T>>;
  async create({
    data,
    option,
  }: {
    data: AnyKeys<T>[];
    option?: CreateOptions | undefined;
  }): Promise<HydratedDocument<T>[]>;
  async create({
    data,
    option,
  }: {
    data: AnyKeys<T>[] | AnyKeys<T>;
    option?: CreateOptions | undefined;
  }): Promise<HydratedDocument<T>[] | HydratedDocument<T>> {
    return await this.model.create(data as any, option);
  }
  async createOne({
    data,
    option,
  }: {
    data: AnyKeys<T>;
    option?: CreateOptions | undefined;
  }): Promise<HydratedDocument<T>> {
    const [doc] = (await this.create({ data: [data], option })) || [];
    return doc as HydratedDocument<T>;
  }

  //findOne
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<T>;
    projection?: ProjectionType<T> | null | undefined;
    options?: (QueryOptions<T> & { lean?: false }) | null | undefined;
  }): Promise<HydratedDocument<T> | null>;
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<T>;
    projection?: ProjectionType<T> | null | undefined;
    options?: (QueryOptions<T> & { lean?: true }) | null | undefined;
  }): Promise<null | FlattenMaps<T>>;
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<T>;
    projection?: ProjectionType<T> | null | undefined;
    options?: QueryOptions<T> | null | undefined;
  }): Promise<HydratedDocument<T> | null | FlattenMaps<T>> {
    const doc = this.model.findOne(filter, projection);
    if (options?.lean) doc.lean(options.lean);
    if (options?.populate) doc.populate(options.populate as any);
    return await doc.exec();
  }

  async find({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<T>;
    projection?: ProjectionType<T> | null | undefined;
    options?: QueryOptions<T> | null | undefined ;
  }): Promise<HydratedDocument<T>[]> {
    const doc = this.model.find(filter, projection);
    if (options?.lean) doc.lean(options.lean);
    if (options?.limit) doc.limit(options.limit);
    if (options?.skip) doc.skip(options.skip);
    if (options?.populate) doc.populate(options.populate as any);
    return await doc.exec();
  }

  async paginate({
    filter,
    projection,
    options = {},
    page = 0,
    size = 5,
  }: {
    filter?: QueryFilter<T>;
    projection?: ProjectionType<T> | null | undefined;
    options?: QueryOptions<T>;
    page?: number | undefined | string;
    size?: number | undefined | string;
  }): Promise<IPaginate<T>> {
    let count: number = -1;
  
    if (Number(page) > 0) {
      page = parseInt(page as string);
      size = parseInt(size as string);
  
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
            pages: Math.ceil(count / (size as number)), 
          }
        : {}),
    };
  }

  //findById
  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<T> | null | undefined;
    options?: (QueryOptions<T> & { lean: false }) | null | undefined;
  }): Promise<HydratedDocument<T> | null>;
  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<T> | null | undefined;
    options?: (QueryOptions<T> & { lean: true }) | null | undefined;
  }): Promise<null | FlattenMaps<T>>;
  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<T> | null | undefined;
    options?: QueryOptions<T> | null | undefined;
  }): Promise<HydratedDocument<T> | null | FlattenMaps<T>> {
    const doc = this.model.findOne(_id, projection);
    if (options?.lean) doc.lean(options.lean);
    return await doc.exec();
  }

  //update
  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<T>;
    update: UpdateQuery<T> | UpdateWithAggregationPipeline;
    options?: QueryOptions<T> | null;
  }): Promise<UpdateResult> {
    return this.model.updateOne(
      filter,
      { ...update, $inc: { __v: 1 } },
      options as any
    );
  }

  async findOneAndUpdate({
    filter,
    update,
    options = { returnDocument: "after" },
  }: {
    filter: QueryFilter<any>;
    update: UpdateQuery<T>;
    options?: QueryOptions<T>;
  }): Promise<HydratedDocument<T> | null> {
    return this.model.findOneAndUpdate(
      filter,
      {
        ...update,
        $inc: { __v: 1 },
      },
      options
    );
  }

  async findByIdAndUpdate({
    _id,
    update,
    options = { new: true },
  }: {
    _id: Types.ObjectId;
    update: UpdateQuery<T>;
    options?: QueryOptions<T> & ReturnsNewDoc;
  }): Promise<HydratedDocument<T> | null> {
    return this.model.findByIdAndUpdate(
      _id,
      { ...update, $inc: { __v: 1 } },
      options
    );
  }
  async updateMany({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<T>;
    update: UpdateQuery<T> | UpdateWithAggregationPipeline;
    options?: QueryOptions<T> | null;
  }): Promise<UpdateResult> {
    return this.model.updateMany(
      filter,
      { ...update, $inc: { __v: 1 } },
      options as any
    );
  }

  //delete
  async deleteOne({
    filter,
  }: {
    filter: QueryFilter<T>;
  }): Promise<DeleteResult> {
    return this.model.deleteOne(filter);
  }

  async findOneAndDelete({
    filter,
  }: {
    filter: QueryFilter<T>;
  }): Promise<HydratedDocument<T> | null> {
    return this.model.findOneAndDelete(filter);
  }

  async findByIdAndDelete({
    _id,
  }: {
    _id: Types.ObjectId;
  }): Promise<HydratedDocument<T> | null> {
    return this.model.findByIdAndDelete(_id);
  }

  async deleteMany({
    filter,
  }: {
    filter: QueryFilter<T>;
  }): Promise<DeleteResult> {
    return this.model.deleteMany(filter);
  }
}
