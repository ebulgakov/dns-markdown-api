"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDbConnectionMiddleware = void 0;
const database_1 = require("../db/database");
const ensureDbConnectionMiddleware = async (_req, _res, next) => {
    try {
        await (0, database_1.dbConnect)();
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.ensureDbConnectionMiddleware = ensureDbConnectionMiddleware;
