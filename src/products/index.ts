import { Router } from "express";

import { cacheAdd, cacheGet } from "../../cache";
import { AnalysisData } from "../../db/models/analysis-data";
import { Pricelist } from "../../db/models/pricelist.ts";

import type { AnalysisData as AnalysisDataType } from "../../types/analysis-data";
import type { DiffHistory } from "../../types/analysis-diff";
import type { PriceList as PriceListType } from "../../types/pricelist";
import type { ProductPayload } from "../../types/product";

const router = Router();

router.get("/link", async (req, res, next) => {
  try {
    const link = req.query.link as string;
    if (!link) return res.status(400).send("link is required");

    const key = `daily:products:link:${link}`;
    const cached = await cacheGet<ProductPayload>(key);
    if (cached) return res.json(cached);

    const historyList = (await AnalysisData.find({ link }).lean().exec()) as AnalysisDataType[];
    historyList?.sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());

    const product = historyList[historyList.length - 1];
    if (!product) return res.status(404).send("Product not found");

    const history: DiffHistory = historyList.map(entry => {
      return {
        dateAdded: entry.dateAdded,
        price: entry.price,
        priceOld: entry.priceOld,
        profit: entry.profit
      };
    });

    const priceList = (await Pricelist.findOne(
      { city: product.city },
      {},
      { sort: { updatedAt: -1 } }
    )
      .lean()
      .exec()) as PriceListType;
    const flatCatalog = priceList?.positions.flatMap(position => position.items);
    const ifExists = flatCatalog.find(item => item.link === link);

    const status = {
      city: product.city,
      updates: [],
      createdAt: history[0]!.dateAdded, // non-null assertion as history has at least one entry here
      updatedAt: history[history.length - 1]!.dateAdded, // non-null assertion as history has at least one entry here
      deleted: !ifExists
    };

    const payload: ProductPayload = {
      item: product,
      history,
      status
    };

    await cacheAdd(key, JSON.stringify(payload), { ex: 60 * 60 * 24 }); // 24 hours

    res.json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;
