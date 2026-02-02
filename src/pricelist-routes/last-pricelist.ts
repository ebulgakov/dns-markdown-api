import { cacheAdd, cacheGet } from "@src/cache";
import { Pricelist } from "@src/db/models/pricelist";

import type { PriceList as PriceListType } from "@src/types/pricelist";
import type { NextFunction, Request, Response } from "express";

async function lastPriceListHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const cityRaw = req.query.city;
    const city = `${cityRaw ?? ""}`.trim();
    if (!city) return res.status(400).send("city is required");

    const key = `daily:pricelist:last:${String(city)}`;
    const cached = await cacheGet<PriceListType>(key);
    if (cached) return res.json(cached);

    const priceList = (await Pricelist.findOne({ city }, {}, { sort: { updatedAt: -1 } })
      .lean()
      .exec()) as PriceListType;
    if (!priceList) return res.status(404).send("Price list not found");

    await cacheAdd<PriceListType>(key, priceList, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(priceList);
  } catch (error) {
    next(error);
  }
}

export default lastPriceListHandler;
