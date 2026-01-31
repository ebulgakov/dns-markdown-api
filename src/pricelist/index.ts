import { Router } from "express";

import { cacheAdd, cacheGet } from "../../cache";
import { Pricelist } from "../../db/models/pricelist";

import type { PriceList as PriceListType, PriceListDate } from "../../types/pricelist";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const key = `daily:pricelist:last:${String(city)}`;
    const cached = await cacheGet<PriceListType>(key);
    if (cached) return res.json(cached);

    const priceList = await Pricelist.findOne({ city }, {}, { sort: { updatedAt: -1 } });
    if (!priceList) return res.status(404).send("Price list not found");

    await cacheAdd(key, JSON.stringify(priceList), { ex: 60 * 60 * 24 }); // 24 hours

    res.json(JSON.parse(priceList));
  } catch (error) {
    next(error);
  }
});

router.get("/list", async (req, res, next) => {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const key = `daily:archive:list:${String(city)}`;
    const cached = await cacheGet<PriceListDate>(key);
    if (cached) return res.json(cached);

    const priceLists = await Pricelist.find({ city }, {}, { sort: { updatedAt: 1 } })
      .select("createdAt")
      .lean()
      .exec();
    if (!priceLists) return res.status(404).send("No archived price lists found");

    await cacheAdd(key, JSON.stringify(priceLists), { ex: 60 * 60 * 24 }); // 24 hours

    res.json(priceLists);
  } catch (error) {
    next(error);
  }
});

router.get("/id/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send("id is required");

    const key = `archive:item:${String(id)}}`;
    const cached = await cacheGet<PriceListDate>(key);
    if (cached) return res.json(cached);

    const priceList = await Pricelist.findOne({ _id: id }).lean().exec();
    if (!priceList) return res.status(404).send("Archived price list not found");

    await cacheAdd(key, JSON.stringify(priceList)); // no expiration

    res.json(priceList);
  } catch (error) {
    next(error);
  }
});

export default router;
