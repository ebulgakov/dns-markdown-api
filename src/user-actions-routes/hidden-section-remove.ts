import { User } from "../../db/models/user";

import type { NextFunction, Request, Response } from "express";

async function hiddenRemoveHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { title } = req.body;
    const { userId } = req.auth || {};

    if (typeof userId !== "string" || !userId.trim()) {
      return res.status(401).send("Authentication required. User identity not found.");
    }

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).send("title is required and must be a non-empty string.");
    }

    const user = await User.findOneAndUpdate(
      { userId: userId.trim() },
      { $pull: { hiddenSections: title.trim() } },
      { new: true, runValidators: true }
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
