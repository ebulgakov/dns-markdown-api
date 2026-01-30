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

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send("id is required");

    const key = `archive:item:${String(id)}}`;
    const cached = await cacheGet<PriceListDate>(key);
    if (cached) res.json(cached);

    const priceList = await Pricelist.findOne({ _id: id });
    if (!priceList) return res.status(404).send("Archived price list not found");

    const plainPriceList = JSON.stringify(priceList);

    await cacheAdd(key, plainPriceList); // no expiration

    res.json(JSON.parse(plainPriceList));
  } catch (error) {
    next(error);
  }
});

export default router;
