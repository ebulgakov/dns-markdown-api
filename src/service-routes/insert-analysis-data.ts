import { AnalysisData } from "../../db/models/analysis-data.ts";

import type { AnalysisData as AnalysisDataType } from "../../types/analysis-data.ts";
import type { NextFunction, Response, Request } from "express";

async function insertAnalysisDataHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { analysisData } = req.body as {
      analysisData: AnalysisDataType[];
    };

    if (!analysisData) return res.status(400).send("analysisData are required");

    await AnalysisData.insertMany(analysisData);
    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
}

export default insertAnalysisDataHandler;
