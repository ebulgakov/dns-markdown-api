import { cacheAdd, cacheGet } from "@src/cache";
import { describeLLMGood } from "@src/llm";
import { convertGoodsToString } from "@src/llm-routes/helpers/convert-to-string.ts";
import { getVectorItemsByIds } from "@src/vector";

import type { NextFunction, Request, Response } from "express";
async function describeProductHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const linkParam = req.query.link;
    if (!linkParam || typeof linkParam !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'link' query parameter" });
    }

    const link = decodeURIComponent(linkParam);

    const key = `llm:describe:${String(link)}`;
    const cached = await cacheGet<string>(key);
    if (cached)
      return res.json({
        message: "Product description result (cached)",
        report: cached
      });

    const [item] = await getVectorItemsByIds([link]);
    if (!item) {
      return res.status(404).json({ error: "Product not found for the provided link" });
    }

    const itemString = convertGoodsToString(item.metadata);

    const describedGoodReport = await describeLLMGood(itemString);

    await cacheAdd<string>(key, describedGoodReport);

    res.json({
      message: "Product description result",
      report: describedGoodReport
    });
  } catch (err) {
    next(err);
  }
}

export default describeProductHandler;
