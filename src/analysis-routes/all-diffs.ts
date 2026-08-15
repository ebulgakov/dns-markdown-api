import { cityQuerySchema } from "@src/analysis-routes/helpers/schemas";
import { cacheAdd, cacheGet } from "@src/cache";
import { AnalysisDiff } from "@src/db/models/analysis-diff";
import { z } from "zod";

import type {
  AnalysisDiff as AnalysisDiffType,
  AnalysisDiffReport
} from "@src/types/analysis-diff";
import type { NextFunction, Request, Response } from "express";

async function allAnalysisDiffsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validationResult = cityQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({ errors: z.prettifyError(validationResult.error) });
    }
    const { city } = validationResult.data;

    const key = `daily:analysis:all:${String(city)}`;
    const cached = await cacheGet<AnalysisDiffReport[]>(key);
    if (cached) return res.json(cached);

    const diffs = (await AnalysisDiff.find({ city }, {}, { sort: { dateAdded: -1 }, limit: 30 })
      .lean()
      .exec()) as AnalysisDiffType[];

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
}

export default allAnalysisDiffsHandler;
