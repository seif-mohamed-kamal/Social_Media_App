"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyServiceModule = exports.StoryServiceModule = void 0;
const domain_exception_1 = require("../../common/exceptions/domain.exception");
const story_repository_1 = require("../../DB/repository/story.repository");
const node_fs_1 = require("node:fs");
class StoryServiceModule {
    storyRepo;
    constructor() {
        this.storyRepo = new story_repository_1.storyRepository();
    }
    async createStory(data, user, file) {
        return await this.storyRepo.createOne({
            data: {
                ...data,
                attachments: file ? file.path : "",
                createdBy: user._id,
            },
        });
    }
    async getMyStories(user) {
        return await this.storyRepo.find({
            filter: {
                createdBy: user._id,
            },
        });
    }
    async getStoryById(storyId, user) {
        const story = await this.storyRepo.findOne({
            filter: {
                _id: storyId,
                createdBy: user._id,
            },
        });
        if (!story) {
            throw new domain_exception_1.NotFoundException("Story not found");
        }
        return story;
    }
    async updateStory(storyId, data, user) {
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
            throw new domain_exception_1.NotFoundException("Story not found");
        }
        return story;
    }
    async deleteStory(storyId, user) {
        const story = await this.storyRepo.findOne({
            filter: {
                _id: storyId,
                createdBy: user._id,
            },
        });
        if (!story) {
            throw new domain_exception_1.NotFoundException("Story not found");
        }
        if (story.attachments) {
            try {
                (0, node_fs_1.rmSync)(story.attachments);
            }
            catch (error) {
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
exports.StoryServiceModule = StoryServiceModule;
exports.storyServiceModule = new StoryServiceModule();
