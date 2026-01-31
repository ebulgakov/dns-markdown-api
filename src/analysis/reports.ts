import { cacheAdd, cacheGet } from "../../cache";
import { Reports } from "../../db/models/reports";

import type { ReportsResponse } from "../../types/reports";
import type { NextFunction, Response, Request } from "express";

async function reportsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const key = `daily:analysis:reports:${String(city)}`;
    const cached = await cacheGet<ReportsResponse>(key);
    if (cached) return res.json(cached);

    const reports = (await Reports.find({ city }, {}, { sort: { dateAdded: -1 }, limit: 30 })
      .lean()
      .exec()) as ReportsResponse;
    if (!reports) return res.status(404).send("Analysis reports not found");

    await cacheAdd<ReportsResponse>(key, reports, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(reports);
  } catch (error) {
    next(error);
  }
}

export default reportsHandler;
