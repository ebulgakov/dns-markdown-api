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

    const user = await User.findOne({ userId }).exec();

    if (!user) return res.status(404).send("User not found");

    const item = {
      status: {
        city: product.city,
        deleted: false,
        createdAt: new Date()
      },
      item: product
    };

    user.favorites.push(item);
    await user.save();

    res.json({ message: "Item added to favorites", favorites: user.favorites });
  } catch (error) {
    next(error);
  }
}
export default addFavoriteHandler;
