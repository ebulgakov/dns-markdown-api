"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pricelist = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const pricelist_1 = __importDefault(require("../schemas/pricelist"));
exports.Pricelist = mongoose_1.default.models.Pricelist || mongoose_1.default.model("Pricelist", pricelist_1.default);
