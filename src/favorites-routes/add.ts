import { User } from "../../db/models/user";

import type { NextFunction, Request, Response } from "express";

async function addFavoriteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { product, userId } = req.body;

    if (typeof userId !== "string" || !userId.trim()) {
      return res.status(401).send("Authentication required. User identity not found.");
    }

    if (typeof product !== "object" || product === null || Array.isArray(product)) {
      return res.status(400).send("product is required and must be a valid object.");
    }

    const item = {
      status: {
        deleted: false,
        createdAt: new Date()
      },
      item: product
    };
    const user = await User.findOneAndUpdate(
      { userId: userId.trim() },
      { $push: { favorites: item } },
      { new: true, runValidators: true }
    ).exec();

    if (!user) return res.status(404).send("User not found");

    res.json({ message: "Item added to favorites", favorites: user.favorites });
  } catch (error) {
    next(error);
  }
}
export default addFavoriteHandler;
