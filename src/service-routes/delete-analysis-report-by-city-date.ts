import { cacheDelete } from "../../cache";
import { Reports } from "../../db/models/reports";

import type { NextFunction, Response, Request } from "express";

async function deleteAnalysisReportByCityDateHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { city: cityRaw, dateAdded: dateAddedRaw } = req.body as {
      city?: unknown;
      dateAdded?: unknown;
    };
    const city = `${cityRaw ?? ""}`.trim();
    const dateAdded = `${dateAddedRaw ?? ""}`.trim();

    if (!city || !dateAdded) {
      return res.status(400).send("city and dateAdded must be non-empty strings");
    }

    // Parse dateAdded to Date to match schema type, or adjust filter accordingly
    const parsedDate = new Date(dateAdded);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).send("dateAdded must be a valid date string");
    }

    await Reports.deleteMany({ city, dateAdded: parsedDate }).exec();

    const key = `daily:analysis:reports:${String(city)}`;

    // TODO: add invalidation of related cache entries
    await cacheDelete(key);

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export default deleteAnalysisReportByCityDateHandler;
