import { AnalysisDiff } from "../../db/models/analysis-diff";

import type { NextFunction, Response, Request } from "express";

async function deleteAnalysisDiffByDateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { city, date } = req.body as { city: string; date: string };

    if (!city || !date) return res.status(400).send("city and date are required");

    await AnalysisDiff.deleteMany({ city, dateAdded: date }).exec();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export default deleteAnalysisDiffByDateHandler;
