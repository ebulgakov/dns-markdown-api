import { getAuth } from "@clerk/express";

import { User } from "../db/models/user";

import type { Request, Response, NextFunction } from "express";

async function removeFavoriteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { link } = req.body;
    const { userId } = getAuth(req);

    if (typeof userId !== "string" || !userId.trim()) {
      return res.status(401).send("Authentication required. User identity not found.");
    }

    if (typeof link !== "string" || !link.trim()) {
      return res.status(400).send("link is required and must be a non-empty string.");
    }

    const user = await User.findOneAndUpdate(
      { userId: userId.trim() },
      { $pull: { favorites: { "item.link": link.trim() } } },
      { new: true, runValidators: true }
    ).exec();

    if (!user) return res.status(404).send("User not found");

    res.json({ message: "Item removed from favorites", favorites: user.favorites });
  } catch (error) {
    next(error);
  }
}

export default removeFavoriteHandler;
