"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionEnum = exports.AvailabilityEnum = void 0;
var AvailabilityEnum;
(function (AvailabilityEnum) {
    AvailabilityEnum[AvailabilityEnum["PUBLIC"] = 0] = "PUBLIC";
    AvailabilityEnum[AvailabilityEnum["PRIVATE"] = 1] = "PRIVATE";
    AvailabilityEnum[AvailabilityEnum["ONLY_ME"] = 2] = "ONLY_ME";
})(AvailabilityEnum || (exports.AvailabilityEnum = AvailabilityEnum = {}));
var ReactionEnum;
(function (ReactionEnum) {
    ReactionEnum[ReactionEnum["LIKE"] = 1] = "LIKE";
    ReactionEnum[ReactionEnum["LOVE"] = 2] = "LOVE";
    ReactionEnum[ReactionEnum["SAD"] = 3] = "SAD";
    ReactionEnum[ReactionEnum["ANGRY"] = 4] = "ANGRY";
})(ReactionEnum || (exports.ReactionEnum = ReactionEnum = {}));
