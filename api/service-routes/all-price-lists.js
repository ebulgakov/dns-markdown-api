"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pricelist_1 = require("../db/models/pricelist");
async function allPriceListsHandler(req, res, next) {
    try {
        const cityRaw = req.query.city;
        const city = `${cityRaw ?? ""}`.trim();
        if (!city)
            return res.status(400).send("city is required");
        const limit = parseInt(`${req.query.limit ?? ""}`.trim(), 10);
        const priceLists = await pricelist_1.Pricelist.find({ city }, {}, { sort: { updatedAt: -1 }, ...(isNaN(limit) ? {} : { limit }) }).exec();
        res.json(priceLists);
    }
    catch (error) {
        next(error);
    }
}
exports.default = allPriceListsHandler;
