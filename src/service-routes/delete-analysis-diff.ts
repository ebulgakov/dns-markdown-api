import { AnalysisDiff } from "../../db/models/analysis-diff.ts";

import type { NextFunction, Response, Request } from "express";

async function deleteAnalysisDiffHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { city } = req.body as { city: string };

    if (!city) return res.status(400).send("city is required");

    await AnalysisDiff.deleteMany({ city }).exec();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export default deleteAnalysisDiffHandler;
