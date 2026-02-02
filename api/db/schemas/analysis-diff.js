"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const analysis_data_1 = __importDefault(require("./analysis-data"));
const analysisDiffSchema = new mongoose_1.default.Schema({
    city: { type: String, required: true, index: true },
    dateAdded: { type: Date, default: Date.now, index: true },
    newItems: [analysis_data_1.default],
    removedItems: [analysis_data_1.default],
    changesPrice: [
        {
            item: analysis_data_1.default,
            diff: {
                priceOld: String,
                price: String,
                profit: String
            }
        }
    ],
    changesProfit: [
        {
            item: analysis_data_1.default,
            diff: {
                priceOld: String,
                price: String,
                profit: String
            }
        }
    ]
});
exports.default = analysisDiffSchema;
