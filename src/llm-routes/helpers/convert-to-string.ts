import type { Goods } from "@src/types/pricelist.ts";

export const convertGoodsToString = (goods: Goods, {}) => {
  let str = "";

  str += `
  ${goods.title}
  Описание: ${goods.description}
  Цена: ${goods.price}р ${goods.priceOld ? `(Новый стоит: ${goods.priceOld}р)` : ""}
  Дефекты: ${goods.reasons}
  Ссылка: ${goods.link}
  `;

  return str;
};
