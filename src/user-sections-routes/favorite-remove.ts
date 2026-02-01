import { User } from "../../db/models/user";

import type { UserSectionsPayload } from "./types";
import type { NextFunction, Request, Response } from "express";

async function favoriteRemoveHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, title } = req.body as UserSectionsPayload;

    if (!userId || !title) return res.status(400).send("userId and title are required");

    const user = await User.findOneAndUpdate(
      { userId },
      { $pull: { favoriteSections: title } },
      { new: true }
    ).exec();

    if (!user) return res.status(404).send("User not found");
    res.json({
      message: "Section removed from favorite sections",
      sections: user.favoriteSections
    });
  } catch (error) {
    next(error);
  }
}

export default favoriteRemoveHandler;
