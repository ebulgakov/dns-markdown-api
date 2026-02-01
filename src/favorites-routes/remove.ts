import { User } from "../../db/models/user";

import type { Request, Response, NextFunction } from "express";

async function removeFavoriteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, link } = req.body as {
      userId: string;
      link: string;
    };
    if (!userId || !link) return res.status(400).send("userId and link are required");

    const user = await User.findOneAndUpdate(
      { userId },
      { $pull: { favorites: { "item.link": link } } },
      { new: true }
    ).exec();

    if (!user) return res.status(404).send("User not found");

    res.json({ message: "Item removed from favorites", favorites: user.favorites });
  } catch (error) {
    next(error);
  }
}

export default removeFavoriteHandler;
