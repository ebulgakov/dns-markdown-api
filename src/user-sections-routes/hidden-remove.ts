import { User } from "../../db/models/user.ts";

import type { UserSectionsPayload } from "./types.ts";
import type { NextFunction, Request, Response } from "express";

async function hiddenRemoveHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, title } = req.body as UserSectionsPayload;

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
}

export default hiddenRemoveHandler;
