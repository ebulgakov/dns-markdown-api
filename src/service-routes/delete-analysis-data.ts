import { AnalysisData } from "../../db/models/analysis-data";

import type { NextFunction, Response, Request } from "express";

async function deleteAnalysisDataHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { city } = req.body as { city: string };

    if (!city?.trim()) return res.status(400).send("city is required");

    await AnalysisData.deleteMany({ city }).exec();

    // TODO: add invalidation of related cache entries
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
export default deleteAnalysisDataHandler;
