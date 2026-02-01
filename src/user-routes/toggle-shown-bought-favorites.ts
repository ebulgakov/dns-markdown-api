import { User } from "../../db/models/user";

import type { NextFunction, Request, Response } from "express";

async function toggleShownBoughtFavoritesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, status } = req.body as {
      userId: string;
      status: boolean;
    };

    if (!userId || status === undefined)
      return res.status(400).send("userId and status are required");

    const user = await User.findOne({ userId }).exec();

    if (!user) return res.status(404).send("User not found");

    user.shownBoughtFavorites = status;
    await user.save();

    res.json({
      message: "Show bought favorites status updated",
      shownBoughtFavorites: user.shownBoughtFavorites
    });
  } catch (error) {
    next(error);
  }
}

export default toggleShownBoughtFavoritesHandler;
