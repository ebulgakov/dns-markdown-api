import { User } from "../../db/models/user";

import type { Goods } from "../../types/pricelist";
import type { NextFunction, Request, Response } from "express";

async function addFavoriteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, product } = req.body as {
      userId: string;
      product: Goods;
    };
    if (!userId || !product) return res.status(400).send("userId and product are required");

    const item = {
      status: {
        city: product.city,
        deleted: false,
        createdAt: new Date()
      },
      item: product
    };
    const user = await User.findOneAndUpdate(
      { userId },
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
