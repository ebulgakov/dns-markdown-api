import { cacheDelete } from "../../cache";
import { Reports } from "../../db/models/reports";

import type { NextFunction, Response, Request } from "express";

async function addAnalysisReportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { city, report, dateAdded } = req.body as {
      city: string;
      report: string;
      dateAdded: string;
    };

    if (!city || !report || !dateAdded)
      return res.status(400).send("city/report/dateAdded are required");

    const newReport = new Reports({ city, dateAdded, report });
    await newReport.save();

    const key = `daily:analysis:reports:${String(city)}`;
    await cacheDelete(key);

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export default addAnalysisReportHandler;
