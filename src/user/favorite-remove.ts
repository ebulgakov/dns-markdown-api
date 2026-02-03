import { getAuth } from "@clerk/express";
import { User } from "@src/db/models/user";
import { z } from "zod";

import type { NextFunction, Request, Response } from "express";

const removeFavoriteSchema = z.object({
  link: z.string().trim().min(1, "link is required and must be a non-empty string.")
});

async function removeFavoriteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validationResult = removeFavoriteSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ errors: z.prettifyError(validationResult.error) });
    }

    const { link } = validationResult.data;
    const { userId } = getAuth(req);

    if (typeof userId !== "string" || !userId.trim()) {
      return res.status(401).send("Authentication required. User identity not found.");
    }

    const user = await User.findOneAndUpdate(
      { userId: userId.trim() },
      { $pull: { favorites: { "item.link": link } } },
      { new: true, runValidators: true }
    ).exec();

    if (!user) return res.status(404).send("User not found");

    res.json({ message: "Item removed from favorites", favorites: user.favorites });
  } catch (error) {
    next(error);
  }
}

export default removeFavoriteHandler;
