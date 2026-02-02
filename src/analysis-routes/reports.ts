import { cacheAdd, cacheGet } from "@src/cache";
import { Reports } from "@src/db/models/reports";

import type { ReportsResponse } from "@src/types/reports";
import type { NextFunction, Response, Request } from "express";

async function reportsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const cityRaw = req.query.city;
    const city = `${cityRaw ?? ""}`.trim();
    if (!city) return res.status(400).send("city is required");

    const key = `daily:analysis:reports:${String(city)}`;
    const cached = await cacheGet<ReportsResponse>(key);
    if (cached) return res.json(cached);

    const reports = (await Reports.find({ city }, {}, { sort: { dateAdded: -1 }, limit: 30 })
      .lean()
      .exec()) as ReportsResponse;

    await cacheAdd<ReportsResponse>(key, reports, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(reports);
  } catch (error) {
    next(error);
  }
}

export default reportsHandler;
