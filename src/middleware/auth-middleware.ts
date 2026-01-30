import type { NextFunction, Request, Response } from "express";
import { env } from "../../env";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.json({ error: "Missing or invalid Authorization header" }).status(401);
  }

  const token = authHeader.split(" ")[1];

  if (token !== env.API_AUTH_SECRET) {
    return res.json({ error: "Unauthorized" }).status(401);
  }

  next();
};
