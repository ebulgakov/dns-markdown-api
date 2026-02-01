import { Pricelist } from "../../../db/models/pricelist";

import type { Goods, PriceList as PriceListType } from "../../../types/pricelist";

const getFlatCatalog = async (city: string): Promise<Goods[]> => {
  const priceList = (await Pricelist.findOne({ city }, {}, { sort: { updatedAt: -1 } })
    .lean()
    .exec()) as PriceListType;
  if (!priceList) return [];
  return priceList.positions.flatMap(position => position.items);
};

export default getFlatCatalog;
