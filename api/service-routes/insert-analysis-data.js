"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const analysis_data_1 = require("../db/models/analysis-data");
async function insertAnalysisDataHandler(req, res, next) {
    try {
        const { analysisData } = req.body;
        if (!Array.isArray(analysisData) || analysisData.length === 0) {
            return res.status(400).send("analysisData must be a non-empty array");
        }
        await analysis_data_1.AnalysisData.insertMany(analysisData);
        res.sendStatus(201);
    }
    catch (error) {
        next(error);
    }
}
exports.default = insertAnalysisDataHandler;
