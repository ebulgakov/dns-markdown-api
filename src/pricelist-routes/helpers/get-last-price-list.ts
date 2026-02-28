import { Pricelist } from "@src/db/models/pricelist.ts";

import type { Goods, PriceList as PriceListType } from "@src/types/pricelist.ts";

export const getLastPriceList = async (city: string): Promise<PriceListType | null> =>
  Pricelist.findOne({ city }, {}, { sort: { updatedAt: -1 } })
    .lean()
    .exec();

export const getLastPriceListFlat = async (city: string): Promise<Goods[]> => {
  const priceList = await getLastPriceList(city);
  if (!priceList) return [];
  return priceList.positions.flatMap(position => position.items);
};
