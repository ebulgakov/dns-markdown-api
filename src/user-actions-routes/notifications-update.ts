import { getAuth } from "@clerk/express";

import { User } from "../../db/models/user";

import type { UserNotifications } from "../../types/user";
import type { NextFunction, Request, Response } from "express";

async function updateNotificationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { notifications: notificationsRaw } = req.body;
    const { userId } = getAuth(req);

    if (typeof userId !== "string" || !userId.trim()) {
      return res.status(401).send("Authentication required. User identity not found.");
    }

    if (typeof notificationsRaw !== "object" || notificationsRaw === null) {
      return res.status(400).send("notifications is required and must be an object.");
    }

    const { updates } = notificationsRaw as UserNotifications;

    if (typeof updates !== "object" || updates === null) {
      return res.status(400).send("notifications must have an 'updates' object property.");
    }

    const { enabled } = updates as { enabled?: unknown };
    if (typeof enabled !== "boolean") {
      return res.status(400).send("notifications.updates must have an 'enabled' boolean property.");
    }

    // Avoid overwriting other notification settings by only updating the provided fields
    const notifications: UserNotifications = {
      updates: {
        enabled
      }
    };

    const user = await User.findOneAndUpdate(
      { userId: userId.trim() },
      { $set: { notifications } },
      { new: true, runValidators: true }
    ).exec();

    if (!user) return res.status(404).send("User not found");

    res.json({ message: "Notifications updated", notifications: user.notifications });
  } catch (error) {
    next(error);
  }
}

export default updateNotificationHandler;
