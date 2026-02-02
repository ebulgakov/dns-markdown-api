import { env } from "@src/env";

import type { NextFunction, Request, Response } from "express";

export const serviceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1] || "";

  // Just in case if token is empty string and API_SERVICE_SECRET also empty string
  if (!token || token !== env.API_SERVICE_SECRET) {
    return res.status(401).json({ error: "Unauthorized Service" });
  }

  next();
};
