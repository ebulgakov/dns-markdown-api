"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisData = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const analysis_data_1 = __importDefault(require("../schemas/analysis-data"));
exports.AnalysisData = mongoose_1.default.models.AnalysisData ||
    mongoose_1.default.model("AnalysisData", analysis_data_1.default);
