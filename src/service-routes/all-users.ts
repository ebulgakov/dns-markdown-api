import { User } from "../../db/models/user";

import type { NextFunction, Response, Request } from "express";

async function allUsersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const city = req.query.city as string;

    if (!city) return res.status(400).send("city is required");

    const users = await User.find({ city }, {}, { sort: { updatedAt: -1 } }).exec();
    res.json(users);
  } catch (error) {
    next(error);
  }
}

export default allUsersHandler;
