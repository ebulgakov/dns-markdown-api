import { cacheAdd, cacheGet } from "@src/cache";
import { AnalysisData } from "@src/db/models/analysis-data";
import { getLastPriceListFlat } from "@src/pricelist-routes/helpers/get-last-price-list";

import type { PriceDropPrediction } from "@src/types/analysis-data";
import type { NextFunction, Request, Response } from "express";

type LinkStats = {
  _id: string;
  firstDate: Date | string;
  lastDate: Date | string;
  count: number;
};

async function priceDropPredictionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const cityRaw = req.query.city;
    const city = `${cityRaw ?? ""}`.trim();
    if (!city) return res.status(400).send("city is required");

    const key = `daily:analysis:price-drop-prediction:${city}`;
    const cached = await cacheGet<PriceDropPrediction[]>(key);
    if (cached) return res.json(cached);

    const flatCatalog = await getLastPriceListFlat(city);
    if (flatCatalog.length === 0) {
      await cacheAdd<PriceDropPrediction[]>(key, [], { ex: 60 * 60 * 24 }); // 24 hours
      return res.json([]);
    }

    const links = [...new Set(flatCatalog.map(item => item.link))];

    const linkStats = (await AnalysisData.aggregate([
      { $match: { city, link: { $in: links } } },
      {
        $group: {
          _id: "$link",
          firstDate: { $min: "$dateAdded" },
          lastDate: { $max: "$dateAdded" },
          count: { $sum: 1 }
        }
      }
    ])) as LinkStats[];

    const statsByLink = new Map(
      linkStats.map(stats => [
        stats._id,
        {
          firstMs: new Date(stats.firstDate).getTime(),
          lastMs: new Date(stats.lastDate).getTime(),
          count: stats.count
        }
      ])
    );

    const predictions: PriceDropPrediction[] = flatCatalog
      .filter(item => (statsByLink.get(item.link)?.count ?? 0) >= 2)
      .map(item => {
        const stats = statsByLink.get(item.link)!;
        const avgIntervalMs = (stats.lastMs - stats.firstMs) / (stats.count - 1);
        const predictionDate = new Date(stats.lastMs + avgIntervalMs).toISOString();
        return { item, predictionDate };
      })
      .sort((a, b) => a.predictionDate.localeCompare(b.predictionDate));

    await cacheAdd<PriceDropPrediction[]>(key, predictions, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(predictions);
  } catch (error) {
    next(error);
  }
}

export default priceDropPredictionHandler;
