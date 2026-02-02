import { cacheAdd, cacheGet } from "@src/cache";

import getFlatCatalog from "./helpers/get-flat-catalog";

import type { Goods } from "@src/types/pricelist";
import type { NextFunction, Request, Response } from "express";

async function mostProfitableProductsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const cityRaw = req.query.city;
    const city = `${cityRaw ?? ""}`.trim();
    if (!city) return res.status(400).send("city is required");

    const key = `daily:products:most-profitable-products:${String(city)}`;
    const cached = await cacheGet<Goods[]>(key);
    if (cached) return res.json(cached);

    const flatCatalog = await getFlatCatalog(city);
    const profitableItems = flatCatalog.filter(
      item => Number(item.profit) && Number(item.profit) > 0
    );
    const nonProfitableItems = flatCatalog.filter(
      item => !Number(item.profit) || Number(item.profit) <= 0
    );
    profitableItems.sort((a, b) => Number(b.profit) - Number(a.profit));

    const sortedByProfit = [...profitableItems, ...nonProfitableItems];

    await cacheAdd<Goods[]>(key, sortedByProfit, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(sortedByProfit);
  } catch (error) {
    next(error);
  }
}

export default mostProfitableProductsHandler;
