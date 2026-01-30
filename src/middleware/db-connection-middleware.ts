import { dbConnect } from "../../db/database";

import type { NextFunction, Request, Response } from "express";

export const ensureDbConnectionMiddleware = async (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    await dbConnect();
    next();
  } catch (error) {
    next(error);
  }
};
