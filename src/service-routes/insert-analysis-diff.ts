import { AnalysisDiff } from "../../db/models/analysis-diff";

import type { AnalysisDiff as AnalysisDiffType } from "../../types/analysis-diff";
import type { NextFunction, Response, Request } from "express";

async function insertAnalysisDiffHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { analysisDiff } = req.body as {
      analysisDiff: AnalysisDiffType[];
    };

    if (!analysisDiff) return res.status(400).send("analysisDiff are required");

    await AnalysisDiff.insertMany(analysisDiff);
    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
}

export default insertAnalysisDiffHandler;
