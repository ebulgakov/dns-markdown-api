import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env, isDev, isTestEnv } from "../env";

import { authMiddleware } from "./middleware/auth-middleware";
import priceListRoutes from "./pricelist/pricelist-routes";

import type { Request, Response } from "express";

const app = express();

// Add logging middleware
app.use(morgan("dev", { skip: () => isTestEnv() }));

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  })
);

app.use(helmet());
app.use(express.json());

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

app.use((err: Error, _req: Request, res: Response) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal Server Error", ...(isDev() && { details: err.message }) });
});

export default app;
