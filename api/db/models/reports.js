"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reports = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const reports_1 = __importDefault(require("../schemas/reports"));
exports.Reports = mongoose_1.default.models.Reports || mongoose_1.default.model("Reports", reports_1.default);
