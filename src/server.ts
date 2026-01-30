import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import { env, isDev } from "../env";
import { authMiddleware } from "./middleware/auth-middleware";
import priceListRoutes from "./pricelist/pricelist-routes";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  })
);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "DNS Markdown API"
  });
});

app.use("/api", authMiddleware);

app.use("/api/pricelist", priceListRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal Server Error", ...(isDev() && { details: err.message }) });
});

export default app;
