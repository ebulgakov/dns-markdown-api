import { cacheAdd, cacheGet } from "../../cache";
import { Pricelist } from "../../db/models/pricelist";

import type { PriceListDate } from "../../types/pricelist";
import type { NextFunction, Request, Response } from "express";

async function listPriceListsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const cityRaw = req.query.city;
    const city = `${cityRaw ?? ""}`.trim();
    if (!city) return res.status(400).send("city is required");

    const key = `daily:archive:list:${String(city)}`;
    const cached = await cacheGet<PriceListDate[]>(key);
    if (cached) return res.json(cached);

    const priceLists = (await Pricelist.find({ city }, {}, { sort: { updatedAt: 1 } })
      .select("createdAt")
      .lean()
      .exec()) as PriceListDate[];
    if (priceLists.length === 0) return res.status(404).send("No archived price lists found");

    await cacheAdd<PriceListDate[]>(key, priceLists, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(priceLists);
  } catch (error) {
    next(error);
  }
}

export default listPriceListsHandler;
