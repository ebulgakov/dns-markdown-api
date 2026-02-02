"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../cache");
const reports_1 = require("../db/models/reports");
async function deleteAnalysisReportByCityDateHandler(req, res, next) {
    try {
        const { city: cityRaw, dateAdded: dateAddedRaw } = req.body;
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
        await reports_1.Reports.deleteMany({ city, dateAdded: parsedDate }).exec();
        const key = `daily:analysis:reports:${String(city)}`;
        // TODO: add invalidation of related cache entries
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
exports.default = deleteAnalysisReportByCityDateHandler;
