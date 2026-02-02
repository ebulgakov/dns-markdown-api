"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConnect = dbConnect;
exports.dbDisconnect = dbDisconnect;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../env");
global.mongoose = global.mongoose || {
    conn: null,
    promise: null
};
async function dbConnect() {
    if (global.mongoose && global.mongoose.conn) {
        return global.mongoose.conn;
    }
    const dbUri = env_1.env.DATABASE_URL;
    const promise = mongoose_1.default.connect(dbUri, {
        autoIndex: true // Auto-indexing for development
    });
    global.mongoose = {
        conn: await promise,
        promise: promise
    };
    return await promise;
}
async function dbDisconnect() {
    if (global.mongoose && global.mongoose.conn) {
        await mongoose_1.default.disconnect();
        global.mongoose.conn = null;
    }
}
