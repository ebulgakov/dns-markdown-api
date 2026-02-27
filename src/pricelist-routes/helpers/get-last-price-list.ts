import { Pricelist } from "@src/db/models/pricelist.ts";

import type { Goods, PriceList as PriceListType } from "@src/types/pricelist.ts";

export const getLastPriceList = async (city: string): Promise<PriceListType | null> => {
  try {
    return (await Pricelist.findOne({ city }, {}, { sort: { updatedAt: -1 } })
      .lean()
      .exec()) as PriceListType | null;
  } catch (error) {
    console.error("Error fetching last price list:", error);
    return null;
  }
};

export const getLastPriceListFlat = async (city: string): Promise<Goods[]> => {
  const priceList = await getLastPriceList(city);
  if (!priceList) return [];
  return priceList.positions.flatMap(position => position.items);
};
