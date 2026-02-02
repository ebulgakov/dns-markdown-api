import { Pricelist } from "../db/models/pricelist";

import type { NextFunction, Request, Response } from "express";

async function allPriceListsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const cityRaw = req.query.city;
    const city = `${cityRaw ?? ""}`.trim();
    if (!city) return res.status(400).send("city is required");

    const limit = parseInt(`${req.query.limit ?? ""}`.trim(), 10);

    const priceLists = await Pricelist.find(
      { city },
      {},
      { sort: { updatedAt: -1 }, ...(isNaN(limit) ? {} : { limit }) }
    ).exec();
    res.json(priceLists);
  } catch (error) {
    next(error);
  }
}

export default allPriceListsHandler;
