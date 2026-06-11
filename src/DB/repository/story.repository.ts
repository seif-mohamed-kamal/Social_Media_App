import { IStory } from "../../common/interface";
import { StoryModel } from "../model";
import { DataBaseRepository } from "./DB.repository";

export class storyRepository extends DataBaseRepository<IStory> {
  constructor() {
    super(StoryModel);
  }
}
