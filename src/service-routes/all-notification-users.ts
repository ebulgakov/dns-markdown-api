import { User } from "../../db/models/user";

import type { NextFunction, Response, Request } from "express";

async function allNotificationUsersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const city = req.query.city as string;

    if (!city?.trim()) return res.status(400).send("city is required");

    const users = await User.find(
      { city, favorites: { $gt: [] }, "notifications.updates.enabled": true },
      {},
      { sort: { updatedAt: -1 } }
    )
      .select("favorites email")
      .exec();
    res.json(users);
  } catch (error) {
    next(error);
  }
}

export default allNotificationUsersHandler;
