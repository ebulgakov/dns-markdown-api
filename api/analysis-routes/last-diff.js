"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const analysis_diff_1 = require("../db/models/analysis-diff");
async function lastAnalysisDiffHandler(req, res, next) {
    try {
        const cityRaw = req.query.city;
        const city = `${cityRaw ?? ""}`.trim();
        if (!city)
            return res.status(400).send("city is required");
        const key = `daily:analysis:last:${String(city)}`;
        const cached = await (0, cache_1.cacheGet)(key);
        if (cached)
            return res.json(cached);
        const diff = (await analysis_diff_1.AnalysisDiff.findOne({ city }, {}, { sort: { dateAdded: -1 } })
            .lean()
            .exec());
        if (!diff)
            return res.status(404).send("Analysis diff not found");
        await (0, cache_1.cacheAdd)(key, diff, { ex: 60 * 60 * 24 }); // 24 hours
        res.json(diff);
    }
    catch (error) {
        next(error);
    }
}
exports.default = lastAnalysisDiffHandler;
