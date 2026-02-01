import { env } from "../../env";

import type { NextFunction, Request, Response } from "express";

export const serviceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.json({ error: "Missing or invalid Authorization header" }).status(401);
  }

  const token = authHeader.split(" ")[1] || "";

  // Just in case if token is empty string and API_SERVICE_SECRET also empty string
  if (!token || token !== env.API_SERVICE_SECRET) {
    return res.json({ error: "Unauthorized Service" }).status(401);
  }

  next();
};
