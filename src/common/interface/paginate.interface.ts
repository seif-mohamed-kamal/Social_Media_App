import { HydratedDocument } from "mongoose";

export interface IPaginate<T> {
  docs: HydratedDocument<T>[];
  currentPage?: number | string;
  pages?: number | string;
  size?: number | string;
}