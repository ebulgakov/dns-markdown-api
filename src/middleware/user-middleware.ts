import { createClerkClient } from "@clerk/clerk-sdk-node";

import { env } from "../../env";

import type { NextFunction, Request, Response } from "express";

const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export const userMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const sessionToken = authHeader.split(" ")[1];

  try {
    const claims = await clerk.verifyToken(`${sessionToken}`);

    req.auth = { userId: claims.sub };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
