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

function getChangeIntervalMs(
  history: HistoryEntry[]
): { lastChangeMs: number; avgIntervalMs: number } | null {
  const changeDatesMs: number[] = [];

  for (let i = 1; i < history.length; i++) {
    const prevPrice = Number(history[i - 1]!.price);
    const currPrice = Number(history[i]!.price);
    // We care about when the price moved, not which direction, so any change
    // (up or down) counts; only unchanged records are skipped.
    if (currPrice !== prevPrice) {
      changeDatesMs.push(new Date(history[i]!.dateAdded).getTime());
    }
  }

  // Need at least two changes to form one complete interval between changes.
  if (changeDatesMs.length < 2) return null;

  // Average the gaps between each pair of consecutive price changes. The gaps
  // can differ a lot (e.g. 61, 30, 6 days), so we sum them and divide by their
  // count rather than only extrapolating from the most recent gap.
  const intervalsMs: number[] = [];
  for (let i = 1; i < changeDatesMs.length; i++) {
    intervalsMs.push(changeDatesMs[i]! - changeDatesMs[i - 1]!);
  }
  const avgIntervalMs =
    intervalsMs.reduce((sum, interval) => sum + interval, 0) / intervalsMs.length;

  const lastChangeMs = changeDatesMs[changeDatesMs.length - 1]!;

  return { lastChangeMs, avgIntervalMs };
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
    // walk the full price timeline and pick out the dates when the price actually
    // changed — a row may record a profit-only change with the same price.
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

    const now = Date.now();
    const predictions: PriceDropPrediction[] = flatCatalog
      .map(item => {
        const linkHistory = historyByLink.get(item.link);
        const changeInterval = linkHistory ? getChangeIntervalMs(linkHistory) : null;
        if (!changeInterval) return null;

        const predictionMs = changeInterval.lastChangeMs + changeInterval.avgIntervalMs;

        return {
          item,
          lastUpdateDate: new Date(changeInterval.lastChangeMs).toISOString(),
          // A prediction in the past means the product is already "overdue" for a
          // change; we keep it in the response but flag it so the frontend can tell.
          expired: predictionMs < now,
          predictionDate: new Date(predictionMs).toISOString()
        };
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
