"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const get_flat_catalog_1 = __importDefault(require("./helpers/get-flat-catalog"));
async function mostDiscountedProductsHandler(req, res, next) {
    try {
        const cityRaw = req.query.city;
        const city = `${cityRaw ?? ""}`.trim();
        if (!city)
            return res.status(400).send("city is required");
        const key = `daily:products:most-discounted-products:${String(city)}`;
        const cached = await (0, cache_1.cacheGet)(key);
        if (cached)
            return res.json(cached);
        const flatCatalog = await (0, get_flat_catalog_1.default)(city);
        const withOldPrice = flatCatalog.filter(item => Number(item.priceOld) && Number(item.priceOld) > 0);
        const withoutOldPrice = flatCatalog.filter(item => !Number(item.priceOld) || Number(item.priceOld) <= 0);
        withOldPrice.sort((a, b) => (Number(a.price) * 100) / Number(a.priceOld) - (Number(b.price) * 100) / Number(b.priceOld));
        const sortedByDiscount = [...withOldPrice, ...withoutOldPrice];
        await (0, cache_1.cacheAdd)(key, sortedByDiscount, { ex: 60 * 60 * 24 }); // 24 hours
        res.json(sortedByDiscount);
    }
    catch (error) {
        next(error);
    }
}
exports.default = mostDiscountedProductsHandler;
