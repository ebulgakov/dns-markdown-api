import { Router } from "express";

import { cacheAdd, cacheGet } from "../../cache";
import { AnalysisDiff } from "../../db/models/analysis-diff";
import { Pricelist } from "../../db/models/pricelist";
import { Reports } from "../../db/models/reports";

import type {
  AnalysisDiff as AnalysisDiffType,
  AnalysisDiffReport
} from "../../types/analysis-diff";
import type { PriceList as PriceListType, PriceListsArchiveCount } from "../../types/pricelist";
import type { ReportsResponse } from "../../types/reports";

const router = Router();

router.get("/last-diff", async (req, res, next) => {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const key = `daily:analysis:last:${String(city)}`;
    const cached = await cacheGet<AnalysisDiffType>(key);
    if (cached) return res.json(cached);

    const diff = (await AnalysisDiff.findOne({ city }, {}, { sort: { dateAdded: -1 } })
      .lean()
      .exec()) as AnalysisDiffType | null;
    if (!diff) return res.status(404).send("Analysis diff not found");

    await cacheAdd<AnalysisDiffType>(key, diff, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(diff);
  } catch (error) {
    next(error);
  }
});

router.get("/reports", async (req, res, next) => {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const key = `daily:analysis:reports:${String(city)}`;
    const cached = await cacheGet<ReportsResponse>(key);
    if (cached) return res.json(cached);

    const reports = (await Reports.find(
      { city },
      {},
      { sort: { dateAdded: -1 }, limit: 30 }
    )) as ReportsResponse;
    if (!reports) return res.status(404).send("Analysis reports not found");

    await cacheAdd<ReportsResponse>(key, reports, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(reports);
  } catch (error) {
    next(error);
  }
});

router.get("/all-diffs", async (req, res, next) => {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const key = `daily:analysis:all:${String(city)}`;
    const cached = await cacheGet<AnalysisDiffReport[]>(key);
    if (cached) return res.json(cached);

    const diffs = (await AnalysisDiff.find(
      { city },
      {},
      { sort: { dateAdded: -1 }, limit: 30 }
    )) as AnalysisDiffType[];

    const report: AnalysisDiffReport[] = [];

    diffs.forEach(diff => {
      report.push({
        city: city,
        dateAdded: diff.dateAdded,
        newItems: diff.newItems.length,
        removedItems: diff.removedItems.length,
        changesPrice: diff.changesPrice.length,
        changesProfit: diff.changesProfit.length
      });
    });

    await cacheAdd<AnalysisDiffReport[]>(key, report, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(report);
  } catch (error) {
    next(error);
  }
});

router.get("/products-count", async (req, res, next) => {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const key = `daily:analysis:products-count:${String(city)}`;
    const cached = await cacheGet<PriceListsArchiveCount[]>(key);
    if (cached) return res.json(cached);

    const priceLists = (await Pricelist.find({ city }, {}, { sort: { updatedAt: -1 }, limit: 30 })
      .lean()
      .exec()) as PriceListType[];
    if (!priceLists) return res.status(404).send("No archived price lists found");

    const productsCountByDates: PriceListsArchiveCount[] = priceLists
      .map(priceList => {
        return {
          date: priceList.createdAt,
          count: priceList.positions.flatMap(position => position.items).length
        };
      })
      .reverse();

    await cacheAdd<PriceListsArchiveCount[]>(key, productsCountByDates, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(productsCountByDates);
  } catch (error) {
    next(error);
  }
});

export default router;
