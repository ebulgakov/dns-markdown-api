"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const analysis_data_1 = require("../db/models/analysis-data");
const get_flat_catalog_1 = __importDefault(require("./helpers/get-flat-catalog"));
async function productByLinkHandler(req, res, next) {
    try {
        const linkRaw = req.query.link;
        const link = `${linkRaw ?? ""}`.trim();
        if (!link)
            return res.status(400).send("link is required");
        const key = `daily:products:link:${link}`;
        const cached = await (0, cache_1.cacheGet)(key);
        if (cached)
            return res.json(cached);
        const historyList = (await analysis_data_1.AnalysisData.find({ link }).lean().exec());
        historyList?.sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());
        const product = historyList[historyList.length - 1];
        if (!product)
            return res.status(404).send("Product not found");
        const history = historyList.map(entry => {
            return {
                dateAdded: entry.dateAdded,
                price: entry.price,
                priceOld: entry.priceOld,
                profit: entry.profit
            };
        });
        const flatCatalog = await (0, get_flat_catalog_1.default)(product.city);
        const ifExists = flatCatalog.find(item => item.link === link);
        const status = {
            createdAt: history[0].dateAdded, // non-null assertion as history has at least one entry here
            updatedAt: history[history.length - 1].dateAdded, // non-null assertion as history has at least one entry here
            deleted: !ifExists
        };
        const payload = {
            item: product,
            history,
            status
        };
        await (0, cache_1.cacheAdd)(key, payload, { ex: 60 * 60 * 24 }); // 24 hours
        res.json(payload);
    }
    catch (error) {
        next(error);
    }
}
exports.default = productByLinkHandler;
