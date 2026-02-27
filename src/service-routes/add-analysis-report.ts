import { cacheDelete } from "@src/cache";
import { Pricelist } from "@src/db/models/pricelist";
import { Reports } from "@src/db/models/reports";
import { generateLLMReport } from "@src/llm";
import { convertGoodsToString } from "@src/llm-routes/helpers/convert-to-string";

import type { PriceList as PriceListType } from "@src/types/pricelist";
import type { NextFunction, Response, Request } from "express";

async function addAnalysisReportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { city: cityRaw } = req.body as { city: string };
    const city = `${cityRaw ?? ""}`.trim();

    if (!city) return res.status(400).send("city is required");

    const priceList = (await Pricelist.findOne({ city }, {}, { sort: { updatedAt: -1 } })
      .lean()
      .exec()) as PriceListType;
    if (!priceList) return res.status(404).send("Price list not found");

    const payload = priceList.positions
      .flatMap(position => position.items)
      .map(convertGoodsToString)
      .join("");

    const report = await generateLLMReport(payload);

    const newReport = new Reports({ city, dateAdded: priceList.createdAt, report });
    await newReport.save();

    const key = `daily:analysis:reports:${String(city)}`;
    try {
      await cacheDelete(key);
    } catch (cacheError) {
      console.warn("Failed to invalidate cache", { key, cacheError });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export default addAnalysisReportHandler;
