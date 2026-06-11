import { HydratedDocument } from "mongoose";
import { IStory, IUser } from "../../common/interface";
import { NotFoundException } from "../../common/exceptions/domain.exception";
import { storyRepository } from "../../DB/repository/story.repository";
import { rmSync } from "node:fs";
export class StoryServiceModule {
  private readonly storyRepo: storyRepository;

  constructor() {
    this.storyRepo = new storyRepository();
  }
  public async createStory(
    data: {
      text?: string;
      attachments?: string;
      type?: number;
    },
    user: HydratedDocument<IUser>,
    file?: Express.Multer.File
  ): Promise<IStory> {
    return await this.storyRepo.createOne({
      data: {
        ...data,
        attachments: file ? file.path : "",
        createdBy: user._id,
      },
    });
  }

  public async getMyStories(user: HydratedDocument<IUser>): Promise<IStory[]> {
    return await this.storyRepo.find({
      filter: {
        createdBy: user._id,
      },
    });
  }

  public async getStoryById(
    storyId: string,
    user: HydratedDocument<IUser>
  ): Promise<IStory> {
    const story = await this.storyRepo.findOne({
      filter: {
        _id: storyId,
        createdBy: user._id,
      },
    });

    if (!story) {
      throw new NotFoundException("Story not found");
    }

    return story;
  }

  public async updateStory(
    storyId: string,
    data: {
      text?: string;
      attachments?: string;
      type?: number;
    },
    user: HydratedDocument<IUser>
  ): Promise<IStory> {
    const story = await this.storyRepo.findOneAndUpdate({
      filter: {
        _id: storyId,
        createdBy: user._id,
      },
      update: {
        $set: {
          ...data,
        },
      },
      options: {
        returnDocument: "after",
      },
    });

    if (!story) {
      throw new NotFoundException("Story not found");
    }

    return story;
  }

  public async deleteStory(
    storyId: string,
    user: HydratedDocument<IUser>
  ): Promise<void> {
    const story = await this.storyRepo.findOne({
      filter: {
        _id: storyId,
        createdBy: user._id,
      },
    });

    if (!story) {
      throw new NotFoundException("Story not found");
    }
    if (story.attachments) {
      try {
        rmSync(story.attachments);
      } catch (error) {
        console.error("Failed to delete file:", error);
      }
    }

    await this.storyRepo.deleteOne({
      filter: {
        _id: storyId,
        createdBy: user._id,
      },
    });
  }
}

export const storyServiceModule = new StoryServiceModule();
