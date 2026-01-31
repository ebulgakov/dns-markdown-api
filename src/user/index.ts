import { Router } from "express";

import { User } from "../../db/models/user";

import type { UserNotifications } from "../../types/user.ts";

const router = Router();

router.get("/id/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send("id is required");

    const user = await User.findOne({ userId: id }).lean().exec();
    if (!user) return res.status(404).send("User not found");

    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/update", async (req, res, next) => {
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
});

router.post("/toggle-shown-bought-favorites", async (req, res, next) => {
  try {
    const { userId, status } = req.body as {
      userId: string;
      status: boolean;
    };

    if (!userId || status === undefined)
      return res.status(400).send("userId and status are required");

    const user = await User.findOne({ userId }).exec();

    if (!user) return res.status(404).send("User not found");

    user.shownBoughtFavorites = status;
    await user.save();

    res.json({
      message: "Show bought favorites status updated",
      shownBoughtFavorites: user.shownBoughtFavorites
    });
  } catch (error) {
    next(error);
  }
});

export default router;
