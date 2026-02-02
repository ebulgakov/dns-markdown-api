"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const last_pricelist_1 = __importDefault(require("./last-pricelist"));
const list_1 = __importDefault(require("./list"));
const pricelist_by_id_1 = __importDefault(require("./pricelist-by-id"));
const router = (0, express_1.Router)();
router.get("/", last_pricelist_1.default);
router.get("/list", list_1.default);
router.get("/id/:id", pricelist_by_id_1.default);
exports.default = router;
