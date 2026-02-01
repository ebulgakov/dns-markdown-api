import { cacheAdd, cacheGet } from "../../cache";
import { AnalysisData } from "../../db/models/analysis-data";

import type { AnalysisData as AnalysisDataType } from "../../types/analysis-data";
import type { NextFunction, Request, Response } from "express";

async function allAnalysisGoodsByDateAddedHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { city, dateAdded } = req.query as { city?: unknown; dateAdded?: unknown };

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

    const key = `analysis:goods-by-date:${parsedDate}-${String(city)}`;
    const cached = await cacheGet<AnalysisDataType[]>(key);
    if (cached) return res.send(cached);

    const goods = (await AnalysisData.find(
      { city, dateAdded: parsedDate },
      {},
      { sort: { updatedAt: 1 } }
    )
      .lean()
      .exec()) as AnalysisDataType[];

    if (!goods) return res.status(404).send("No goods found");

    await cacheAdd<AnalysisDataType[]>(key, goods); // Save forever

    res.json(goods);
  } catch (error) {
    next(error);
  }
}

export default allAnalysisGoodsByDateAddedHandler;
