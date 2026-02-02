"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const goods_1 = __importDefault(require("./goods"));
const analysisDataSchema = goods_1.default.clone();
analysisDataSchema.add({
    city: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    dateAdded: { type: Date, default: Date.now, index: true }
});
exports.default = analysisDataSchema;
