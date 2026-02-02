import { cacheDelete } from "@src/cache";
import { Pricelist } from "@src/db/models/pricelist";

import type { Position } from "@src/types/pricelist";
import type { NextFunction, Response, Request } from "express";

async function addNewPriceListHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { city: cityRaw, positions } = req.body as { city: unknown; positions: Position[] };
    const city = `${cityRaw ?? ""}`.trim();

    if (!city || !Array.isArray(positions) || positions.length === 0) {
      return res.status(400).send("city and positions are required");
    }

    const priceList = new Pricelist({
      city,
      positions
    });

    await priceList.save();

    const key = `daily:pricelist:last:${String(city)}`;
    try {
      await cacheDelete(key);
    } catch (cacheError) {
      console.warn("Failed to invalidate cache", { key, cacheError });
    }

    res.status(201).json(priceList);
  } catch (error) {
    next(error);
  }
}

export default addNewPriceListHandler;
