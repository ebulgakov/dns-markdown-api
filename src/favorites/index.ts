import { Router } from "express";

import { User } from "../../db/models/user";

import type { Goods } from "../../types/pricelist";
import type { Favorite } from "../../types/user";

const router = Router();

router.post("/add", async (req, res, next) => {
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
});

router.post("/remove", async (req, res, next) => {
  try {
    const { userId, link } = req.body as {
      userId: string;
      link: string;
    };
    if (!userId || !link) return res.status(400).send("userId and link are required");

    const user = await User.findOne({ userId }).exec();

    if (!user) return res.status(404).send("User not found");

    user.favorites = user.favorites.filter((fav: Favorite) => fav.item.link !== link);
    await user.save();

    res.json({ message: "Item removed from favorites", favorites: user.favorites });
  } catch (error) {
    next(error);
  }
});

export default router;
