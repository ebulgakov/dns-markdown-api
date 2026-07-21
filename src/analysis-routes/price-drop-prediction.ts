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

// A gap this much smaller than the city-wide typical interval is treated as noise
// (e.g. several changes within days of each other) rather than a real cadence signal.
const ANOMALY_FRACTION = 0.2;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

// We care about when the price moved, not which direction, so any change (up or
// down) counts; only unchanged records (e.g. a profit-only update) are skipped.
function getChangeDatesMs(history: HistoryEntry[]): number[] {
  const changeDatesMs: number[] = [];
  for (let i = 1; i < history.length; i++) {
    const prevPrice = Number(history[i - 1]!.price);
    const currPrice = Number(history[i]!.price);
    if (currPrice !== prevPrice) {
      changeDatesMs.push(new Date(history[i]!.dateAdded).getTime());
    }
  }
  return changeDatesMs;
}

// Walks a product's own change dates and drops gaps that are anomalously short
// relative to the city's typical interval, so a burst of rapid changes doesn't
// drag the product's own median down. The reference point always advances to
// the current date regardless, so a whole burst is skipped as noise and the
// next real gap is measured from the burst's last point, not its first.
function filterAnomalousGaps(
  changeDatesMs: number[],
  globalMedianMs: number | null
): { usableGaps: number[]; lastChangeMs: number } | null {
  if (changeDatesMs.length === 0) return null;

  const usableGaps: number[] = [];
  let lastKeptMs = changeDatesMs[0]!;

  for (let i = 1; i < changeDatesMs.length; i++) {
    const currentMs = changeDatesMs[i]!;
    const gap = currentMs - lastKeptMs;
    const isAnomalous = globalMedianMs !== null && gap < ANOMALY_FRACTION * globalMedianMs;
    if (!isAnomalous) usableGaps.push(gap);
    lastKeptMs = currentMs;
  }

  return { usableGaps, lastChangeMs: lastKeptMs };
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

    const changeDatesByLink = new Map<string, number[]>();
    const firstSeenMsByLink = new Map<string, number>();
    for (const [link, entries] of historyByLink) {
      firstSeenMsByLink.set(link, new Date(entries[0]!.dateAdded).getTime());
      changeDatesByLink.set(link, getChangeDatesMs(entries));
    }

    // Reference interval for the whole city: the median of every raw gap between
    // consecutive price changes, pooled across all products. Used both as the
    // anomaly threshold above and as the fallback estimate for products that
    // don't have enough history of their own (see below).
    const allGapsMs: number[] = [];
    for (const changeDatesMs of changeDatesByLink.values()) {
      for (let i = 1; i < changeDatesMs.length; i++) {
        allGapsMs.push(changeDatesMs[i]! - changeDatesMs[i - 1]!);
      }
    }
    const globalMedianMs = allGapsMs.length > 0 ? median(allGapsMs) : null;

    const now = Date.now();
    const predictions: PriceDropPrediction[] = flatCatalog
      .map(item => {
        const changeDatesMs = changeDatesByLink.get(item.link) ?? [];
        const filtered = filterAnomalousGaps(changeDatesMs, globalMedianMs);

        let intervalMs: number | null = null;
        let lastUpdateMs: number | undefined;

        if (filtered && filtered.usableGaps.length > 0) {
          // Enough of the product's own history survived anomaly filtering to
          // estimate its own cadence.
          intervalMs = median(filtered.usableGaps);
          lastUpdateMs = filtered.lastChangeMs;
        } else if (globalMedianMs !== null) {
          // Too little history of its own (0 or 1 change, or every gap was
          // anomalous) — fall back to the city-wide typical interval, anchored
          // to the last thing we actually know about this product.
          intervalMs = globalMedianMs;
          lastUpdateMs = filtered?.lastChangeMs ?? firstSeenMsByLink.get(item.link);
        }

        if (intervalMs === null || lastUpdateMs === undefined) return null;

        const predictionMs = lastUpdateMs + intervalMs;

        return {
          item,
          lastUpdateDate: new Date(lastUpdateMs).toISOString(),
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
