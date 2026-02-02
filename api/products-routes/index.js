"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const most_cheap_products_1 = __importDefault(require("./most-cheap-products"));
const most_discounted_products_1 = __importDefault(require("./most-discounted-products"));
const most_profitable_products_1 = __importDefault(require("./most-profitable-products"));
const product_by_link_1 = __importDefault(require("./product-by-link"));
const router = (0, express_1.Router)();
router.get("/link", product_by_link_1.default);
router.get("/most-cheap-products", most_cheap_products_1.default);
router.get("/most-discounted-products", most_discounted_products_1.default);
router.get("/most-profitable-products", most_profitable_products_1.default);
exports.default = router;
