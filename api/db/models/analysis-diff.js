"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisDiff = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const analysis_diff_1 = __importDefault(require("../schemas/analysis-diff"));
exports.AnalysisDiff = mongoose_1.default.models.AnalysisDiff ||
    mongoose_1.default.model("AnalysisDiff", analysis_diff_1.default);
