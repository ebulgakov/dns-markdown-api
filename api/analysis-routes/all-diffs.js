"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const analysis_diff_1 = require("../db/models/analysis-diff");
async function allAnalysisDiffsHandler(req, res, next) {
    try {
        const cityRaw = req.query.city;
        const city = `${cityRaw ?? ""}`.trim();
        if (!city)
            return res.status(400).send("city is required");
        const key = `daily:analysis:all:${String(city)}`;
        const cached = await (0, cache_1.cacheGet)(key);
        if (cached)
            return res.json(cached);
        const diffs = (await analysis_diff_1.AnalysisDiff.find({ city }, {}, { sort: { dateAdded: -1 }, limit: 30 })
            .lean()
            .exec());
        const report = [];
        diffs.forEach(diff => {
            report.push({
                city: city,
                dateAdded: diff.dateAdded,
                newItems: diff.newItems.length,
                removedItems: diff.removedItems.length,
                changesPrice: diff.changesPrice.length,
                changesProfit: diff.changesProfit.length
            });
        });
        await (0, cache_1.cacheAdd)(key, report, { ex: 60 * 60 * 24 }); // 24 hours
        res.json(report);
    }
    catch (error) {
        next(error);
    }
}
exports.default = allAnalysisDiffsHandler;
