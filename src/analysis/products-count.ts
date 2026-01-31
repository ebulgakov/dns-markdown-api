import { cacheAdd, cacheGet } from "../../cache";
import { Pricelist } from "../../db/models/pricelist.ts";

import type { PriceList as PriceListType, PriceListsArchiveCount } from "../../types/pricelist.ts";
import type { NextFunction, Request, Response } from "express";

async function productsCountHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const key = `daily:analysis:products-count:${String(city)}`;
    const cached = await cacheGet<PriceListsArchiveCount[]>(key);
    if (cached) return res.json(cached);

    const priceLists = (await Pricelist.find({ city }, {}, { sort: { updatedAt: -1 }, limit: 30 })
      .lean()
      .exec()) as PriceListType[];
    if (!priceLists) return res.status(404).send("No archived price lists found");

    const productsCountByDates: PriceListsArchiveCount[] = priceLists
      .map(priceList => {
        return {
          date: priceList.createdAt,
          count: priceList.positions.flatMap(position => position.items).length
        };
      })
      .reverse();

    await cacheAdd<PriceListsArchiveCount[]>(key, productsCountByDates, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(productsCountByDates);
  } catch (error) {
    next(error);
  }
}

export default productsCountHandler;
