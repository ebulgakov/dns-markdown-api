import mongoose from "mongoose";

import priceListSchema from "../schemas/pricelist.ts";

import type { PriceList } from "../../types/pricelist.ts";

export const Pricelist =
  mongoose.models.Pricelist || mongoose.model<PriceList>("Pricelist", priceListSchema);
