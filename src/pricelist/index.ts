import { Router } from "express";

import { cacheAdd, cacheGet } from "../../cache";
import { Pricelist } from "../../db/models/pricelist";

import type { PriceList } from "../../types/pricelist";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const key = `daily:pricelist:last:${String(city)}`;
    const cached = await cacheGet<PriceList>(key);
    if (cached) res.json(cached);

    const priceList = await Pricelist.findOne({ city }, {}, { sort: { updatedAt: -1 } });
    if (!priceList) return res.status(404).send("Price list not found");

    const plainPriceList = JSON.stringify(priceList);

    await cacheAdd(key, plainPriceList, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(JSON.parse(plainPriceList));
  } catch (error) {
    next(error);
  }
});

export default router;
