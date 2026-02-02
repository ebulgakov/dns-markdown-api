"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const pricelist_1 = require("../db/models/pricelist");
async function lastPriceListHandler(req, res, next) {
    try {
        const cityRaw = req.query.city;
        const city = `${cityRaw ?? ""}`.trim();
        if (!city)
            return res.status(400).send("city is required");
        const key = `daily:pricelist:last:${String(city)}`;
        const cached = await (0, cache_1.cacheGet)(key);
        if (cached)
            return res.json(cached);
        const priceList = (await pricelist_1.Pricelist.findOne({ city }, {}, { sort: { updatedAt: -1 } })
            .lean()
            .exec());
        if (!priceList)
            return res.status(404).send("Price list not found");
        await (0, cache_1.cacheAdd)(key, priceList, { ex: 60 * 60 * 24 }); // 24 hours
        res.json(priceList);
    }
    catch (error) {
        next(error);
    }
}
exports.default = lastPriceListHandler;
