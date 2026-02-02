"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const pricelist_1 = require("../db/models/pricelist");
async function listPriceListsHandler(req, res, next) {
    try {
        const cityRaw = req.query.city;
        const city = `${cityRaw ?? ""}`.trim();
        if (!city)
            return res.status(400).send("city is required");
        const key = `daily:archive:list:${String(city)}`;
        const cached = await (0, cache_1.cacheGet)(key);
        if (cached)
            return res.json(cached);
        const priceLists = (await pricelist_1.Pricelist.find({ city }, {}, { sort: { updatedAt: 1 } })
            .select("createdAt")
            .lean()
            .exec());
        await (0, cache_1.cacheAdd)(key, priceLists, { ex: 60 * 60 * 24 }); // 24 hours
        res.json(priceLists);
    }
    catch (error) {
        next(error);
    }
}
exports.default = listPriceListsHandler;
