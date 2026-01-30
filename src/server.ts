import express from "express";
import type { NextFunction, Request, Response } from "express";
import { env } from "../env";

const app = express();

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.json({ error: "Missing or invalid Authorization header" }).status(401);
  }

  const token = authHeader.split(" ")[1];

  if (token !== process.env.AUTH_SECRET) {
    return res.json({ error: "Unauthorized" }).status(401);
  }

  next();
};

app.use("/api", authMiddleware);

app.get("/api", (_req, res) => {
  res.json({
    message: "Hello from Express on Vercel!",
    var: {
      NODE_ENV: env.NODE_ENV
    },
    env: env
  });
});

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "Server is running"
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
