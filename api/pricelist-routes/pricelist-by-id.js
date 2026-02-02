"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const pricelist_1 = require("../db/models/pricelist");
async function priceListByIdHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!id)
            return res.status(400).send("id is required");
        const key = `archive:item:${String(id)}`;
        const cached = await (0, cache_1.cacheGet)(key);
        if (cached)
            return res.json(cached);
        const priceList = (await pricelist_1.Pricelist.findOne({ _id: id }).lean().exec());
        if (!priceList)
            return res.status(404).send("Archived price list not found");
        await (0, cache_1.cacheAdd)(key, priceList); // no expiration
        res.json(priceList);
    }
    catch (error) {
        next(error);
    }
}
exports.default = priceListByIdHandler;
