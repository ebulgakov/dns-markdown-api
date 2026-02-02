"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
async function clearCacheByKeyHandler(req, res, next) {
    try {
        const { keys: rawKeys } = req.body;
        const keys = `${rawKeys ?? ""}`.trim();
        if (!keys?.trim())
            return res.status(400).send("keys is required");
        const foundKeys = await (0, cache_1.cacheKeys)(keys);
        await Promise.all(foundKeys
            .map(key => (key && key !== "" ? key : null))
            .filter(Boolean)
            .map(key => (0, cache_1.cacheDelete)(key)));
        res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}
exports.default = clearCacheByKeyHandler;
