"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const analysis_diff_1 = require("../db/models/analysis-diff");
async function insertAnalysisDiffHandler(req, res, next) {
    try {
        const { diff } = req.body;
        if (!Array.isArray(diff) || diff.length === 0) {
            return res.status(400).send("diff must be a non-empty array");
        }
        await analysis_diff_1.AnalysisDiff.insertMany(diff);
        res.sendStatus(201);
    }
    catch (error) {
        next(error);
    }
}
exports.default = insertAnalysisDiffHandler;
