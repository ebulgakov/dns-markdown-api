import { Router } from "express";

import { Pricelist } from "../../db/models/pricelist";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const priceList = await Pricelist.findOne({ city }, {}, { sort: { updatedAt: -1 } });
    if (!priceList) return res.status(404).send("Price list not found");

    const plainPriceList = JSON.stringify(priceList);

    // cacheAdd..

    res.json(JSON.parse(plainPriceList));
  } catch (error) {
    next(error); // Передаем ошибку в middleware для обработки ошибок
  }
});

export default router;
