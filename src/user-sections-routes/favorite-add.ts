import { User } from "../../db/models/user.ts";

import type { UserSectionsPayload } from "./types.ts";
import type { NextFunction, Request, Response } from "express";

async function favoriteAddHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, title } = req.body as UserSectionsPayload;

    if (!userId || !title) return res.status(400).send("userId and title are required");

    const user = await User.findOne({ userId }).exec();

    if (!user) return res.status(404).send("User not found");

    if (!user.favoriteSections.includes(title)) {
      user.favoriteSections.push(title);
    }

    await user.save();

    res.json({ message: "Section added to favorite sections", sections: user.favoriteSections });
  } catch (error) {
    next(error);
  }
}

export default favoriteAddHandler;
