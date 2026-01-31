import { Router } from "express";

import { cacheAdd, cacheGet } from "../../cache";
import { AnalysisDiff } from "../../db/models/analysis-diff";

import type { AnalysisDiff as AnalysisDiffType } from "../../types/analysis-diff";

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

export default router;
