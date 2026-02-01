import { Pricelist } from "../../db/models/pricelist";

import type { NextFunction, Request, Response } from "express";

async function deleteLastPriceListHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { city } = req.body as { city: string };

    if (!city) return res.status(400).send("city is required");

    await Pricelist.findOneAndDelete({ city }, { sort: { updatedAt: -1 } }).exec();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export default deleteLastPriceListHandler;
