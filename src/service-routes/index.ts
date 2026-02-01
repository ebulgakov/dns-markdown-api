import { Router } from "express";

import { Pricelist } from "../../db/models/pricelist";

import type { Position } from "../../types/pricelist";

const router = Router();

router.post("/delete-last-price-list", async (req, res, next) => {
  try {
    const { city } = req.body as { city: string };

    if (!city) return res.status(400).send("city is required");

    await Pricelist.findOneAndDelete({ city }, { sort: { updatedAt: -1 } }).exec();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

router.post("/add-new-price-list", async (req, res, next) => {
  try {
    const { city, positions } = req.body as { city: string; positions: Position[] };

    if (!city || !positions) return res.status(400).send("city and positions are required");

    const priceList = new Pricelist({
      city,
      positions
    });
    await priceList.save();

    res.status(201).json(priceList);
  } catch (error) {
    next(error);
  }
});

export default router;
