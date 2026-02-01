import type { NextFunction, Request, Response } from "express";

// Fix Vercel Edge Middleware issue with Clerk
export const clerkAsyncMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { clerkMiddleware } = require("@clerk/express");
  clerkMiddleware()(req, res, next);
};
