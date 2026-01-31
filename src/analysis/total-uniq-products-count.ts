import { cacheAdd, cacheGet } from "../../cache";
import { AnalysisData } from "../../db/models/analysis-data";

import type { AnalysisData as AnalysisDataType } from "../../types/analysis-data";
import type { NextFunction, Request, Response } from "express";

async function totalUniqProductsCountHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const key = `daily:analysis:uniq-count:${String(city)}`;
    const cached = await cacheGet<number>(key);
    if (cached) return res.send(cached);

    const data = (await AnalysisData.find({ city }, {}, { sort: { updatedAt: 1 } })
      .select("link")
      .lean()
      .exec()) as AnalysisDataType[];

    if (!data) return res.status(404).send("No archived price lists found");

    const links = data.map(item => item.link) as string[];
    const uniqueLinks = Array.from(new Set(links));

    const uniqueCount = uniqueLinks.length;

    await cacheAdd<number>(key, uniqueCount, { ex: 60 * 60 * 24 }); // 24 hours

    res.send(uniqueCount);
  } catch (error) {
    next(error);
  }
}

export default totalUniqProductsCountHandler;
