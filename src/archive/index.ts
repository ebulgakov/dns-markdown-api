import { Router } from "express";

import { cacheAdd, cacheGet } from "../../cache";
import { Pricelist } from "../../db/models/pricelist.ts";

import type { PriceListDate } from "../../types/pricelist.ts";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const key = `daily:archive:list:${String(city)}`;
    const cached = await cacheGet<PriceListDate>(key);
    if (cached) res.json(cached);

    const priceLists = await Pricelist.find({ city }, {}, { sort: { updatedAt: 1 } }).select(
      "createdAt"
    );
    if (!priceLists) return res.status(404).send("No archived price lists found");

    const plainPriceLists = JSON.stringify(priceLists);

    await cacheAdd(key, plainPriceLists, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(JSON.parse(plainPriceLists));
  } catch (error) {
    next(error);
  }
});

export default router;
