import { Reports } from "../../db/models/reports";

import type { NextFunction, Response, Request } from "express";

async function deleteAnalysisReportByCityDateHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { city, dateAdded } = req.body as { city: string; dateAdded: string };

    if (!city || !dateAdded) return res.status(400).send("city and dateAdded are required");

    await Reports.deleteMany({ city, dateAdded }).exec();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export default deleteAnalysisReportByCityDateHandler;
