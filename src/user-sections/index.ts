import { Router } from "express";

import { User } from "../../db/models/user";

const router = Router();

type Payload = {
  userId: string;
  title: string;
};

router.post("/hidden-add", async (req, res, next) => {
  try {
    const { userId, title } = req.body as Payload;

    if (!userId || !title) return res.status(400).send("userId and title are required");

    const user = await User.findOne({ userId }).exec();

    if (!user) return res.status(404).send("User not found");

    if (!user.hiddenSections.includes(title)) {
      user.hiddenSections.push(title);
    }

    await user.save();

    res.json({ message: "Section added to hidden sections", sections: user.hiddenSections });
  } catch (error) {
    next(error);
  }
});

router.post("/hidden-remove", async (req, res, next) => {
  try {
    const { userId, title } = req.body as Payload;

    if (!userId || !title) return res.status(400).send("userId and title are required");

    const user = await User.findOne({ userId }).exec();

    if (!user) return res.status(404).send("User not found");

    user.hiddenSections = user.hiddenSections.filter((section: string) => section !== title);

    await user.save();

    res.json({
      message: "Section removed from hidden sections",
      sections: user.hiddenSections
    });
  } catch (error) {
    next(error);
  }
});

router.post("/favorite-add", async (req, res, next) => {
  try {
    const { userId, title } = req.body as Payload;

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
});

router.post("/favorite-remove", async (req, res, next) => {
  try {
    const { userId, title } = req.body as Payload;

    if (!userId || !title) return res.status(400).send("userId and title are required");

    const user = await User.findOne({ userId }).exec();

    if (!user) return res.status(404).send("User not found");

    user.favoriteSections = user.favoriteSections.filter((section: string) => section !== title);

    await user.save();

    res.json({
      message: "Section removed from favorite sections",
      sections: user.favoriteSections
    });
  } catch (error) {
    next(error);
  }
});

export default router;
