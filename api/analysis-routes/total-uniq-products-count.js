"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const analysis_data_1 = require("../db/models/analysis-data");
async function totalUniqProductsCountHandler(req, res, next) {
    try {
        const cityRaw = req.query.city;
        const city = `${cityRaw ?? ""}`.trim();
        if (!city)
            return res.status(400).send("city is required");
        const key = `daily:analysis:uniq-count:${String(city)}`;
        const cached = await (0, cache_1.cacheGet)(key);
        if (cached)
            return res.send(cached);
        const data = (await analysis_data_1.AnalysisData.find({ city }, {}, { sort: { updatedAt: 1 } })
            .select("link")
            .lean()
            .exec());
        const links = data.map(item => item.link);
        const uniqueLinks = Array.from(new Set(links));
        const uniqueCount = uniqueLinks.length;
        await (0, cache_1.cacheAdd)(key, uniqueCount, { ex: 60 * 60 * 24 }); // 24 hours
        res.send(uniqueCount);
    }
    catch (error) {
        next(error);
    }
}
exports.default = totalUniqProductsCountHandler;
