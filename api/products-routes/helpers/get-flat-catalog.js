"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pricelist_1 = require("../../db/models/pricelist");
const getFlatCatalog = async (city) => {
    const priceList = (await pricelist_1.Pricelist.findOne({ city }, {}, { sort: { updatedAt: -1 } })
        .lean()
        .exec());
    if (!priceList)
        return [];
    return priceList.positions.flatMap(position => position.items);
};
exports.default = getFlatCatalog;
