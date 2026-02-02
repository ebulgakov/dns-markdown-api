"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_by_id_1 = __importDefault(require("./user-by-id"));
const router = (0, express_1.Router)();
router.get("/id/:id", user_by_id_1.default);
exports.default = router;
