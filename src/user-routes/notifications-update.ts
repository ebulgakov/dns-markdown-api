import { User } from "../../db/models/user.ts";

import type { UserNotifications } from "../../types/user.ts";
import type { NextFunction, Request, Response } from "express";

async function updateNotificationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, notifications } = req.body as {
      userId: string;
      notifications: UserNotifications;
    };
    if (!userId || !notifications)
      return res.status(400).send("userId and notifications are required");

    const user = await User.findOne({ userId }).exec();

    if (!user) return res.status(404).send("User not found");

    user.notifications = notifications;
    await user.save();

    res.json({ message: "Notifications updated", notifications: user.notifications });
  } catch (error) {
    next(error);
  }
}

export default updateNotificationHandler;
