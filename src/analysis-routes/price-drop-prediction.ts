import { cacheAdd, cacheGet } from "@src/cache";
import { AnalysisData } from "@src/db/models/analysis-data";
import { getLastPriceListFlat } from "@src/pricelist-routes/helpers/get-last-price-list";

import type { PriceDropPrediction } from "@src/types/analysis-data";
import type { NextFunction, Request, Response } from "express";

type HistoryEntry = {
  link: string;
  price: string;
  dateAdded: Date | string;
};

function getDropIntervalMs(
  history: HistoryEntry[]
): { lastDropMs: number; avgIntervalMs: number } | null {
  const dropDatesMs: number[] = [];

  for (let i = 1; i < history.length; i++) {
    const prevPrice = Number(history[i - 1]!.price);
    const currPrice = Number(history[i]!.price);
    if (currPrice < prevPrice) {
      dropDatesMs.push(new Date(history[i]!.dateAdded).getTime());
    }
  }

  if (dropDatesMs.length < 2) return null;

  const firstDropMs = dropDatesMs[0]!;
  const lastDropMs = dropDatesMs[dropDatesMs.length - 1]!;
  const avgIntervalMs = (lastDropMs - firstDropMs) / (dropDatesMs.length - 1);

  return { lastDropMs, avgIntervalMs };
}

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

    // Fetch every recorded price for each product (not just first/last) so we can
    // walk the full price timeline and pick out actual drops (price decreases),
    // rather than assuming every AnalysisData row is a price change.
    const history = (await AnalysisData.find(
      { city, link: { $in: links } },
      { link: 1, price: 1, dateAdded: 1 }
    )
      .sort({ link: 1, dateAdded: 1 })
      .lean()
      .exec()) as HistoryEntry[];

    const historyByLink = new Map<string, HistoryEntry[]>();
    for (const entry of history) {
      const entries = historyByLink.get(entry.link) ?? [];
      entries.push(entry);
      historyByLink.set(entry.link, entries);
    }

    const predictions: PriceDropPrediction[] = flatCatalog
      .map(item => {
        const linkHistory = historyByLink.get(item.link);
        const dropInterval = linkHistory ? getDropIntervalMs(linkHistory) : null;
        if (!dropInterval) return null;

        const lastUpdateDate = new Date(dropInterval.lastDropMs).toISOString();
        const predictionDate = new Date(
          dropInterval.lastDropMs + dropInterval.avgIntervalMs
        ).toISOString();
        return { item, lastUpdateDate, predictionDate };
      })
      .filter((prediction): prediction is PriceDropPrediction => prediction !== null)
      .sort((a, b) => a.predictionDate.localeCompare(b.predictionDate));

    await cacheAdd<PriceDropPrediction[]>(key, predictions, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(predictions);
  } catch (error) {
    next(error);
  }
}

export default priceDropPredictionHandler;
