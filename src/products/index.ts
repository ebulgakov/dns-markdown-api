import { Router } from "express";

import { cacheAdd, cacheGet } from "../../cache";
import { AnalysisData } from "../../db/models/analysis-data";
import { Pricelist } from "../../db/models/pricelist.ts";

import type { AnalysisData as AnalysisDataType } from "../../types/analysis-data";
import type { DiffHistory } from "../../types/analysis-diff";
import type { Goods, PriceList as PriceListType } from "../../types/pricelist";
import type { ProductPayload } from "../../types/product";

const router = Router();

const getFlatCatalog = async (city: string): Promise<Goods[]> => {
  const priceList = (await Pricelist.findOne({ city }, {}, { sort: { updatedAt: -1 } })
    .lean()
    .exec()) as PriceListType;
  return priceList?.positions.flatMap(position => position.items);
};

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

    const flatCatalog = await getFlatCatalog(product.city);
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

    await cacheAdd<ProductPayload>(key, payload, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get("/most-cheap-products", async (req, res, next) => {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const key = `daily:products:most-cheap-products:${String(city)}`;
    const cached = await cacheGet<Goods[]>(key);
    if (cached) return res.json(cached);

    const flatCatalog = await getFlatCatalog(city);
    const sortedByPrice = flatCatalog
      .filter(item => Number(item.price) && Number(item.price) > 0)
      .sort((a, b) => Number(a.price) - Number(b.price));

    await cacheAdd<Goods[]>(key, sortedByPrice, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(sortedByPrice);
  } catch (error) {
    next(error);
  }
});

router.get("/most-discounted-products", async (req, res, next) => {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const key = `daily:products:most-discounted-products:${String(city)}`;
    const cached = await cacheGet<Goods[]>(key);
    if (cached) return res.json(cached);

    const flatCatalog = await getFlatCatalog(city);
    const withOldPrice = flatCatalog.filter(
      item => Number(item.priceOld) && Number(item.priceOld) > 0
    );
    const withoutOldPrice = flatCatalog.filter(
      item => !Number(item.priceOld) || Number(item.priceOld) <= 0
    );
    withOldPrice.sort(
      (a, b) =>
        (Number(a.price) * 100) / Number(a.priceOld) - (Number(b.price) * 100) / Number(b.priceOld)
    );

    const sortedByDiscount = [...withOldPrice, ...withoutOldPrice];

    await cacheAdd<Goods[]>(key, sortedByDiscount, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(sortedByDiscount);
  } catch (error) {
    next(error);
  }
});

router.get("/most-profitable-products", async (req, res, next) => {
  try {
    const city = req.query.city as string;
    if (!city) return res.status(400).send("city is required");

    const key = `daily:products:most-profitable-products:${String(city)}`;
    const cached = await cacheGet<Goods[]>(key);
    if (cached) return res.json(cached);

    const flatCatalog = await getFlatCatalog(city);
    const profitableItems = flatCatalog.filter(
      item => Number(item.profit) && Number(item.profit) > 0
    );
    const nonProfitableItems = flatCatalog.filter(
      item => !Number(item.profit) || Number(item.profit) <= 0
    );
    profitableItems.sort((a, b) => Number(b.profit) - Number(a.profit));

    const sortedByProfit = [...profitableItems, ...nonProfitableItems];

    await cacheAdd<Goods[]>(key, sortedByProfit, { ex: 60 * 60 * 24 }); // 24 hours

    res.json(sortedByProfit);
  } catch (error) {
    next(error);
  }
});

export default router;
