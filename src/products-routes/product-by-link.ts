import { cacheAdd, cacheGet } from "@src/cache";
import { AnalysisData } from "@src/db/models/analysis-data";
import { getLastPriceListFlat } from "@src/pricelist-routes/helpers/get-last-price-list";

import type { AnalysisData as AnalysisDataType } from "@src/types/analysis-data";
import type { DiffHistory } from "@src/types/analysis-diff";
import type { ProductPayload } from "@src/types/product";
import type { FavoriteStatus } from "@src/types/user";
import type { NextFunction, Request, Response } from "express";

async function productByLinkHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const linkRaw = req.query.link as string;
    const link = `${linkRaw ?? ""}`.trim();
    if (!link) return res.status(400).send("link is required");

    const key = `daily:products:link:${link}`;
    const cached = await cacheGet<ProductPayload>(key);
    if (cached) return res.json(cached);

    const historyList = (await AnalysisData.find({ link }).lean().exec()) as AnalysisDataType[];
    historyList?.sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());

    const [product] = historyList;
    if (!product) return res.status(404).send("Product not found");

    const history: DiffHistory = historyList.map(entry => {
      return {
        dateAdded: entry.dateAdded,
        price: entry.price,
        priceOld: entry.priceOld,
        profit: entry.profit
      };
    });

    const flatCatalog = await getLastPriceListFlat(product.city);
    const ifExists = flatCatalog.find(item => item.link === link);

    const status: FavoriteStatus = {
      createdAt: history[0]!.dateAdded, // non-null assertion as history has at least one entry here
      updatedAt: history[history.length - 1]!.dateAdded, // non-null assertion as history has at least one entry here
      deleted: !ifExists,
      city: product.city
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
}

export default productByLinkHandler;
