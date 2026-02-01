import { User } from "../../db/models/user";

import type { UserSectionsPayload } from "./types";
import type { NextFunction, Request, Response } from "express";

async function hiddenAddHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, title } = req.body as UserSectionsPayload;

    if (!userId || !title) return res.status(400).send("userId and title are required");

    const user = await User.findOneAndUpdate(
      { userId },
      { $addToSet: { hiddenSections: title } },
      { new: true }
    ).exec();

    if (!user) return res.status(404).send("User not found");
    res.json({ message: "Section added to hidden sections", sections: user.hiddenSections });
  } catch (error) {
    next(error);
  }
}

export default hiddenAddHandler;
