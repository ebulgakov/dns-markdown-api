"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const get_flat_catalog_1 = __importDefault(require("./helpers/get-flat-catalog"));
async function mostProfitableProductsHandler(req, res, next) {
    try {
        const cityRaw = req.query.city;
        const city = `${cityRaw ?? ""}`.trim();
        if (!city)
            return res.status(400).send("city is required");
        const key = `daily:products:most-profitable-products:${String(city)}`;
        const cached = await (0, cache_1.cacheGet)(key);
        if (cached)
            return res.json(cached);
        const flatCatalog = await (0, get_flat_catalog_1.default)(city);
        const profitableItems = flatCatalog.filter(item => Number(item.profit) && Number(item.profit) > 0);
        const nonProfitableItems = flatCatalog.filter(item => !Number(item.profit) || Number(item.profit) <= 0);
        profitableItems.sort((a, b) => Number(b.profit) - Number(a.profit));
        const sortedByProfit = [...profitableItems, ...nonProfitableItems];
        await (0, cache_1.cacheAdd)(key, sortedByProfit, { ex: 60 * 60 * 24 }); // 24 hours
        res.json(sortedByProfit);
    }
    catch (error) {
        next(error);
    }
}
exports.default = mostProfitableProductsHandler;
