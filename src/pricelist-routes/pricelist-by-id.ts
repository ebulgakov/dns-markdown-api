import { cacheAdd, cacheGet } from "../../cache";
import { Pricelist } from "../../db/models/pricelist.ts";

import type { PriceList as PriceListType } from "../../types/pricelist.ts";
import type { NextFunction, Request, Response } from "express";

async function priceListByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send("id is required");

    const key = `archive:item:${String(id)}`;
    const cached = await cacheGet<PriceListType>(key);
    if (cached) return res.json(cached);

    const priceList = (await Pricelist.findOne({ _id: id }).lean().exec()) as PriceListType;
    if (!priceList) return res.status(404).send("Archived price list not found");

    await cacheAdd<PriceListType>(key, priceList); // no expiration

    res.json(priceList);
  } catch (error) {
    next(error);
  }
}

export default priceListByIdHandler;
