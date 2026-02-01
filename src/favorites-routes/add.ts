import { User } from "../../db/models/user";

import type { Goods } from "../../types/pricelist";
import type { NextFunction, Request, Response } from "express";

async function addFavoriteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { product: productRaw, userId } = req.body;

    if (typeof userId !== "string" || !userId.trim()) {
      return res.status(401).send("Authentication required. User identity not found.");
    }

    if (typeof productRaw !== "object" || productRaw === null) {
      return res.status(400).send("product is required and must be a valid object.");
    }

    // Validate that product has a valid 'city' property
    const { city } = productRaw as Partial<Goods>;
    if (typeof city !== "string" || !city.trim()) {
      return res.status(400).send("product must have a valid 'city' property.");
    }

    const product = productRaw as Goods;

    const item = {
      status: {
        city: product.city,
        deleted: false,
        createdAt: new Date()
      },
      item: product
    };
    const user = await User.findOneAndUpdate(
      { userId: userId.trim() },
      { $push: { favorites: item } },
      { new: true }
    ).exec();

    if (!user) return res.status(404).send("User not found");

    res.json({ message: "Item added to favorites", favorites: user.favorites });
  } catch (error) {
    next(error);
  }
}
export default addFavoriteHandler;
