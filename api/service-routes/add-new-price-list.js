"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const pricelist_1 = require("../db/models/pricelist");
async function addNewPriceListHandler(req, res, next) {
    try {
        const { city: cityRaw, positions } = req.body;
        const city = `${cityRaw ?? ""}`.trim();
        if (!city || !Array.isArray(positions) || positions.length === 0) {
            return res.status(400).send("city and positions are required");
        }
        const priceList = new pricelist_1.Pricelist({
            city,
            positions
        });
        await priceList.save();
        const key = `daily:pricelist:last:${String(city)}`;
        try {
            await (0, cache_1.cacheDelete)(key);
        }
        catch (cacheError) {
            console.warn("Failed to invalidate cache", { key, cacheError });
        }
        res.status(201).json(priceList);
    }
    catch (error) {
        next(error);
    }
}
exports.default = addNewPriceListHandler;
