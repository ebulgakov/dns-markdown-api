"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const reportsSchema = new mongoose_1.default.Schema({
    city: { type: String, required: true, index: true },
    dateAdded: { type: Date, default: Date.now, index: true },
    report: { type: String, required: true }
});
exports.default = reportsSchema;
