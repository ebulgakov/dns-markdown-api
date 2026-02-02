"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const analysis_data_1 = require("../db/models/analysis-data");
async function deleteAnalysisDataHandler(req, res, next) {
    try {
        const { city: cityRaw } = req.body;
        const city = `${cityRaw ?? ""}`.trim();
        if (!city)
            return res.status(400).send("city is required");
        await analysis_data_1.AnalysisData.deleteMany({ city }).exec();
        // TODO: add invalidation of related cache entries
        res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}
exports.default = deleteAnalysisDataHandler;
