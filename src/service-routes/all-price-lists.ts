import { Pricelist } from "../../db/models/pricelist";

import type { NextFunction, Request, Response } from "express";

async function allPriceListsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const city = req.query.city as string;

    if (!city) return res.status(400).send("city is required");

    const priceLists = await Pricelist.find({ city }, {}, { sort: { updatedAt: -1 } }).exec();
    res.json(priceLists);
  } catch (error) {
    next(error);
  }
}

export default allPriceListsHandler;
