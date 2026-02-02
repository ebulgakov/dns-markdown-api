"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const create_user_1 = __importDefault(require("./create-user"));
const router = (0, express_1.Router)();
router.post("/create-user", create_user_1.default);
exports.default = router;
