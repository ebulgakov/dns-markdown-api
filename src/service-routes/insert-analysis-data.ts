import { AnalysisData } from "../../db/models/analysis-data";

import type { AnalysisData as AnalysisDataType } from "../../types/analysis-data";
import type { NextFunction, Response, Request } from "express";

async function insertAnalysisDataHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { analysisData } = req.body as {
      analysisData: AnalysisDataType[];
    };

    if (!Array.isArray(analysisData) || analysisData.length === 0) {
      return res.status(400).send("analysisData must be a non-empty array");
    }

    await AnalysisData.insertMany(analysisData);
    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
}

export default insertAnalysisDataHandler;
