"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const goodsSchema = new mongoose_1.default.Schema({
    title: String,
    link: String,
    description: String,
    reasons: [
        {
            label: String,
            text: String
        }
    ],
    priceOld: String,
    price: String,
    profit: String,
    code: String,
    image: String,
    available: String
});
exports.default = goodsSchema;
