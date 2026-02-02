"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const analysis_data_1 = require("../db/models/analysis-data");
async function deleteAnalysisDataByDateHandler(req, res, next) {
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
        await analysis_data_1.AnalysisData.deleteMany({ city, dateAdded: parsedDate }).exec();
        // TODO: add invalidation of related cache entries
        res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}
exports.default = deleteAnalysisDataByDateHandler;
