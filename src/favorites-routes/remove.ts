import { User } from "../../db/models/user.ts";

import type { Favorite } from "../../types/user.ts";
import type { Request, Response, NextFunction } from "express";

async function removeFavoriteHandler(req: Request, res: Response, next: NextFunction) {
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
}

export default removeFavoriteHandler;
