import type { Goods } from "@src/types/pricelist.ts";

export const convertGoodsToString = (goods: Goods, {}) => {
  let str = "";

  str += `
  ${goods.title}
  Description: ${goods.description}
  Price: ${goods.price} RUB ${goods.priceOld ? `(New: ${goods.priceOld} RUB)` : ""}
  Defects: ${goods.reasons}
  Link: ${goods.link}
  `;

  return str;
};
