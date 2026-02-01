import { Pricelist } from "../../db/models/pricelist";

import type { Position } from "../../types/pricelist";
import type { NextFunction, Response, Request } from "express";

async function addNewPriceListHandler(req: Request, res: Response, next: NextFunction) {
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
}

export default addNewPriceListHandler;
