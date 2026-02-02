import { env } from "../env";

import type { NextFunction, Request, Response } from "express";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1] || "";

  // Just in case if token is empty string and some of the secrets also empty string
  if (!token || ![env.API_SERVICE_SECRET, env.API_AUTH_SECRET].includes(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
};
