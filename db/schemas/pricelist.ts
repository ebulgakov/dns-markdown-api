import mongoose from "mongoose";

import Goods from "./goods.ts";

export const priceListSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true
    },
    positions: [
      {
        title: String,
        items: [Goods]
      }
    ]
  },
  {
    timestamps: true
  }
);

export default priceListSchema;
