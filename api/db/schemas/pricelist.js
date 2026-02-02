"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const goods_1 = __importDefault(require("./goods"));
const priceListSchema = new mongoose_1.default.Schema({
    city: {
        type: String,
        required: true
    },
    positions: [
        {
            title: String,
            items: [goods_1.default]
        }
    ]
}, {
    timestamps: true
});
exports.default = priceListSchema;
