import { AnalysisData } from "../../db/models/analysis-data.ts";

import type { NextFunction, Response, Request } from "express";

async function deleteAnalysisDataHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { city } = req.body as { city: string };

    if (!city) return res.status(400).send("city is required");

    await AnalysisData.deleteMany({ city }).exec();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
export default deleteAnalysisDataHandler;
