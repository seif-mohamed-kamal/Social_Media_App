import {
  FlattenMaps,
  HydratedDocument,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
} from "mongoose";
import { IChat } from "../../common/interface";
import { chatModel } from "../model";
import { DataBaseRepository } from "./DB.repository";

export class chatRepository extends DataBaseRepository<IChat> {
  constructor() {
    super(chatModel);
  }
  // Method overloads
  async findOneChat({
    filter,
    projection,
    options,
    page,
    size,
  }: {
    filter?: QueryFilter<IChat>;
    projection?: ProjectionType<IChat> | null | undefined;
    options?: (QueryOptions<IChat> & { lean?: false }) | null | undefined;
    page?: string | number;
    size?: string | number;
  }): Promise<HydratedDocument<IChat> | null>;

  async findOneChat({
    filter,
    projection,
    options,
    page,
    size,
  }: {
    filter?: QueryFilter<IChat>;
    projection?: ProjectionType<IChat> | null | undefined;
    options?: (QueryOptions<IChat> & { lean?: true }) | null | undefined;
    page?: string | number;
    size?: string | number;
  }): Promise<FlattenMaps<IChat> | null>;

  // Implementation
  async findOneChat({
    filter,
    projection,
    options,
    page = "1",
    size = "5",
  }: {
    filter?: QueryFilter<IChat>;
    projection?: ProjectionType<IChat> | null | undefined;
    options?: (QueryOptions<IChat> & { lean?: boolean }) | null | undefined;
    page?: string | number;
    size?: string | number;
  }): Promise<HydratedDocument<IChat> | FlattenMaps<IChat> | null> {
    const pageNum = parseInt(page as string);
    const sizeNum = parseInt(size as string);


    let query = this.model.findOne(filter, {messages: { $slice: [-pageNum * sizeNum, sizeNum] }});

    if (options?.populate) {
      query = query.populate(options.populate as PopulateOptions[]);
    }

    if (options?.lean !== undefined) {
      query = query.lean(options.lean);
    }

    return await query.exec();
  }
}
