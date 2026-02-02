"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const reports_1 = require("../db/models/reports");
async function addAnalysisReportHandler(req, res, next) {
    try {
        const { city, report, dateAdded } = req.body;
        if (!city || !report || !dateAdded)
            return res.status(400).send("city/report/dateAdded are required");
        const newReport = new reports_1.Reports({ city, dateAdded, report });
        await newReport.save();
        const key = `daily:analysis:reports:${String(city)}`;
        try {
            await (0, cache_1.cacheDelete)(key);
        }
        catch (cacheError) {
            console.warn("Failed to invalidate cache", { key, cacheError });
        }
        res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}
exports.default = addAnalysisReportHandler;
