import { User } from "../db/models/user";

import type { NextFunction, Request, Response } from "express";

async function userByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send("id is required");

    const user = await User.findOne({ userId: id }).lean().exec();
    if (!user) return res.status(404).send("User not found");

    res.json(user);
  } catch (error) {
    next(error);
  }
}

export default userByIdHandler;
