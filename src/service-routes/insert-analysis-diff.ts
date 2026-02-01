import { AnalysisDiff } from "../../db/models/analysis-diff";

import type { AnalysisDiff as AnalysisDiffType } from "../../types/analysis-diff";
import type { NextFunction, Response, Request } from "express";

async function insertAnalysisDiffHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { diff } = req.body as {
      diff: AnalysisDiffType[];
    };

    if (!Array.isArray(diff) || diff.length === 0) {
      return res.status(400).send("analysisDiff must be a non-empty array");
    }

    await AnalysisDiff.insertMany(diff);
    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
}

export default insertAnalysisDiffHandler;
