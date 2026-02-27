import { cacheDelete } from "@src/cache";
import { Reports } from "@src/db/models/reports";
import { generateLLMReport } from "@src/llm";
import { convertGoodsToString } from "@src/llm-routes/helpers/convert-to-string";
import { getLastPriceList } from "@src/pricelist-routes/helpers/get-last-price-list";

import type { NextFunction, Response, Request } from "express";

async function addAnalysisReportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { city: cityRaw } = req.body as { city: string };
    const city = `${cityRaw ?? ""}`.trim();

    if (!city) return res.status(400).send("city is required");

    const priceList = await getLastPriceList(city);
    if (!priceList) return res.status(404).send("Price list not found");

    const payload = priceList.positions
      .flatMap(position => position.items)
      .map(convertGoodsToString)
      .join("");

    // Remove existing report for the same city and date to avoid duplicates
    await Reports.deleteMany({ city, dateAdded: priceList.createdAt }).exec();

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
