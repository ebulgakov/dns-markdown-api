import { getAuth } from "@clerk/express";
import { User } from "@src/db/models/user";

import type { NextFunction, Request, Response } from "express";

async function toggleShownBoughtFavoritesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    const { userId } = getAuth(req);

    if (typeof userId !== "string" || !userId.trim()) {
      return res.status(401).send("Authentication required. User identity not found.");
    }

    if (typeof status !== "boolean") {
      return res.status(400).send("Invalid 'status' value. It must be a boolean.");
    }

    const user = await User.findOneAndUpdate(
      { userId: userId.trim() },
      { $set: { shownBoughtFavorites: status } },
      { new: true, runValidators: true }
    ).exec();

    if (!user) return res.status(404).send("User not found");
    res.json({
      message: "Show bought favorites status updated",
      shownBoughtFavorites: user.shownBoughtFavorites
    });
  } catch (error) {
    next(error);
  }
}

export default toggleShownBoughtFavoritesHandler;
