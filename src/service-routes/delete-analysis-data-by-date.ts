import { AnalysisData } from "../../db/models/analysis-data";

import type { NextFunction, Response, Request } from "express";

async function deleteAnalysisDataByDateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { city, date } = req.body as { city: string; date: string };

    if (!city || !date) return res.status(400).send("city and date are required");

    await AnalysisData.deleteMany({ city, dateAdded: date }).exec();

    // TODO: add invalidation of related cache entries
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export default deleteAnalysisDataByDateHandler;
