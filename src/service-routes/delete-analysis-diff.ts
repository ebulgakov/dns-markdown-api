import { AnalysisDiff } from "../db/models/analysis-diff";

import type { NextFunction, Response, Request } from "express";

async function deleteAnalysisDiffHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { city: cityRaw } = req.body as { city: unknown };
    const city = `${cityRaw ?? ""}`.trim();
    if (!city) return res.status(400).send("city is required");

    await AnalysisDiff.deleteMany({ city }).exec();

    // TODO: add invalidation of related cache entries
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export default deleteAnalysisDiffHandler;
