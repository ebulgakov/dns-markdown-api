"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const reports_1 = require("../db/models/reports");
async function reportsHandler(req, res, next) {
    try {
        const cityRaw = req.query.city;
        const city = `${cityRaw ?? ""}`.trim();
        if (!city)
            return res.status(400).send("city is required");
        const key = `daily:analysis:reports:${String(city)}`;
        const cached = await (0, cache_1.cacheGet)(key);
        if (cached)
            return res.json(cached);
        const reports = (await reports_1.Reports.find({ city }, {}, { sort: { dateAdded: -1 }, limit: 30 })
            .lean()
            .exec());
        await (0, cache_1.cacheAdd)(key, reports, { ex: 60 * 60 * 24 }); // 24 hours
        res.json(reports);
    }
    catch (error) {
        next(error);
    }
}
exports.default = reportsHandler;
