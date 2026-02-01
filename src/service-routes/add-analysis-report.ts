import { Reports } from "../../db/models/reports.ts";

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

    return newReport.save();
  } catch (error) {
    next(error);
  }
}

export default addAnalysisReportHandler;
