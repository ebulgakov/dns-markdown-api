import { User } from "../../db/models/user";

import type { UserSectionsPayload } from "./types";
import type { NextFunction, Request, Response } from "express";

async function hiddenRemoveHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, title } = req.body as UserSectionsPayload;

    if (!userId || !title) return res.status(400).send("userId and title are required");

    const user = await User.findOneAndUpdate(
      { userId },
      { $pull: { hiddenSections: title } },
      { new: true }
    ).exec();

    if (!user) return res.status(404).send("User not found");
    res.json({
      message: "Section removed from hidden sections",
      sections: user.hiddenSections
    });
  } catch (error) {
    next(error);
  }
}

export default hiddenRemoveHandler;
