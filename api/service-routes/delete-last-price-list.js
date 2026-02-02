"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const pricelist_1 = require("../db/models/pricelist");
async function deleteLastPriceListHandler(req, res, next) {
    try {
        const { city: cityRaw } = req.body;
        const city = `${cityRaw ?? ""}`.trim();
        if (!city)
            return res.status(400).send("city is required");
        await pricelist_1.Pricelist.findOneAndDelete({ city }, { sort: { updatedAt: -1 } }).exec();
        const key = `daily:pricelist:last:${String(city)}`;
        try {
            await (0, cache_1.cacheDelete)(key);
        }
        catch (cacheError) {
            console.warn("Failed to invalidate cache", { key, cacheError });
        }
        res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}
exports.default = deleteLastPriceListHandler;
