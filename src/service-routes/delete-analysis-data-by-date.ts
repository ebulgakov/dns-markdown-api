import { AnalysisData } from "../../db/models/analysis-data";

import type { NextFunction, Response, Request } from "express";

async function deleteAnalysisDataByDateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { city, dateAdded } = req.body as { city?: unknown; dateAdded?: unknown };

    if (
      typeof city !== "string" ||
      typeof dateAdded !== "string" ||
      !city.trim() ||
      !dateAdded.trim()
    ) {
      return res.status(400).send("city and dateAdded must be non-empty strings");
    }

    // Parse dateAdded to Date to match schema type, or adjust filter accordingly
    const parsedDate = new Date(dateAdded);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).send("dateAdded must be a valid date string");
    }

    await AnalysisData.deleteMany({ city, dateAdded: parsedDate }).exec();

    // TODO: add invalidation of related cache entries
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export default deleteAnalysisDataByDateHandler;
