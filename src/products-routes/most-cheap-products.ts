import { cacheAdd, cacheGet } from "../cache";

import getFlatCatalog from "./helpers/get-flat-catalog";

import type { Goods } from "../types/pricelist";
import type { NextFunction, Request, Response } from "express";

async function mostCheapProductsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const cityRaw = req.query.city;
    const city = `${cityRaw ?? ""}`.trim();
    if (!city) return res.status(400).send("city is required");

    const key = `daily:products:most-cheap-products:${String(city)}`;
    const cached = await cacheGet<Goods[]>(key);
    if (cached) return res.json(cached);

    const flatCatalog = await getFlatCatalog(city);
    const sortedByPrice = flatCatalog
      .filter(item => Number(item.price) && Number(item.price) > 0)
      .sort((a, b) => Number(a.price) - Number(b.price));

    await cacheAdd<Goods[]>(key, sortedByPrice, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(sortedByPrice);
  } catch (error) {
    next(error);
  }
}

export default mostCheapProductsHandler;
