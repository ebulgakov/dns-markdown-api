import { verifyToken } from "@clerk/backend";

import { env } from "../../env";

import type { NextFunction, Request, Response } from "express";

export const userMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const sessionToken = authHeader.split(" ")[1];

  try {
    const verifiedToken = await verifyToken(sessionToken!, {
      secretKey: env.CLERK_SECRET_KEY,
    });

    req.auth = { userId: verifiedToken.sub };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
