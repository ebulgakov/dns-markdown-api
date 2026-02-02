import { User } from "@src/db/models/user";

import type { Favorite } from "@src/types/user";
import type { NextFunction, Response, Request } from "express";

async function updateUsersFavoritesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { users } = req.body as {
      users: { userId: string; favorites: Favorite[] }[];
    };

    if (!users) return res.status(400).send("users are required");

    const bulkOps = users.map(user => ({
      updateOne: {
        filter: { userId: user.userId },
        update: { favorites: user.favorites }
      }
    }));

    await User.bulkWrite(bulkOps);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export default updateUsersFavoritesHandler;
