"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const analysis_data_1 = require("../db/models/analysis-data");
async function allAnalysisGoodsByDateAddedHandler(req, res, next) {
    try {
        const { city: cityRaw, dateAdded: dateAddedRaw } = req.query;
        const city = `${cityRaw ?? ""}`.trim();
        const dateAdded = `${dateAddedRaw ?? ""}`.trim();
        if (!city || !dateAdded) {
            return res.status(400).send("city and dateAdded must be non-empty strings");
        }
        // Parse dateAdded to Date to match schema type, or adjust filter accordingly
        const parsedDate = new Date(dateAdded);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).send("dateAdded must be a valid date string");
        }
        const key = `analysis:goods-by-date:${parsedDate.toISOString()}-${String(city)}`;
        const cached = await (0, cache_1.cacheGet)(key);
        if (cached)
            return res.send(cached);
        const goods = (await analysis_data_1.AnalysisData.find({ city, dateAdded: parsedDate }, {}, { sort: { updatedAt: 1 } })
            .lean()
            .exec());
        await (0, cache_1.cacheAdd)(key, goods); // Save forever
        res.json(goods);
    }
    catch (error) {
        next(error);
    }
}
exports.default = allAnalysisGoodsByDateAddedHandler;
