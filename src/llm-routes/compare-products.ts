import { cacheAdd, cacheGet } from "@src/cache";
import { compareLLMGoods } from "@src/llm";
import { convertGoodsToString } from "@src/llm-routes/helpers/convert-to-string";
import { getVectorItemsByIds } from "@src/vector";

import type { NextFunction, Request, Response } from "express";

async function compareProductsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const linksParam = req.query.links;
    if (!linksParam || typeof linksParam !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'links' query parameter" });
    }

    let linksStr: string;
    try {
      linksStr = decodeURIComponent(linksParam);
    } catch {
      return res.status(400).json({ error: "Malformed 'links' query parameter" });
    }

    const links = linksStr.split("|");

    if (links.length < 2 || links.length > 5) {
      return res.status(400).json({
        error: "At least two product links are required for comparison (max five)"
      });
    }

    const key = `llm:compare:${String(linksParam)}`;
    const cached = await cacheGet<string>(key);
    if (cached)
      return res.json({
        message: "Product comparison result (cached)",
        report: cached
      });

    const items = await getVectorItemsByIds(links);
    const itemsString = items.map(({ metadata }) => convertGoodsToString(metadata)).join("\n");

    const comparedGoodsReport = await compareLLMGoods(itemsString);

    await cacheAdd<string>(key, comparedGoodsReport);

    res.json({
      message: "Product comparison result",
      report: comparedGoodsReport
    });
  } catch (err) {
    next(err);
  }
}

export default compareProductsHandler;
