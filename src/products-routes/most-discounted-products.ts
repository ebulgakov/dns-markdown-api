import { cacheAdd, cacheGet } from "@src/cache";

import getFlatCatalog from "./helpers/get-flat-catalog";

import type { Goods } from "@src/types/pricelist";
import type { NextFunction, Request, Response } from "express";

async function mostDiscountedProductsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const cityRaw = req.query.city;
    const city = `${cityRaw ?? ""}`.trim();
    if (!city) return res.status(400).send("city is required");

    const key = `daily:products:most-discounted-products:${String(city)}`;
    const cached = await cacheGet<Goods[]>(key);
    if (cached) return res.json(cached);

    const flatCatalog = await getFlatCatalog(city);
    const withOldPrice = flatCatalog.filter(
      item => Number(item.priceOld) && Number(item.priceOld) > 0
    );
    const withoutOldPrice = flatCatalog.filter(
      item => !Number(item.priceOld) || Number(item.priceOld) <= 0
    );
    withOldPrice.sort(
      (a, b) =>
        (Number(a.price) * 100) / Number(a.priceOld) - (Number(b.price) * 100) / Number(b.priceOld)
    );

    const sortedByDiscount = [...withOldPrice, ...withoutOldPrice];

    await cacheAdd<Goods[]>(key, sortedByDiscount, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(sortedByDiscount);
  } catch (error) {
    next(error);
  }
}

export default mostDiscountedProductsHandler;
