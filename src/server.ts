import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env, isDev, isTestEnv } from "../env";

import analysisRoutes from "./analysis";
import favoritesRoutes from "./favorites";
import { authMiddleware } from "./middleware/auth-middleware";
import { ensureDbConnectionMiddleware } from "./middleware/db-connection-middleware";
import priceListRoutes from "./pricelist";
import productsRoutes from "./products";
import userRoutes from "./user";
import userSectionsRoutes from "./user-sections";

import type { NextFunction, Request, Response } from "express";

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

app.use(ensureDbConnectionMiddleware);

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
app.use("/api/products", productsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/user-sections", userSectionsRoutes);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal Server Error", ...(isDev() && { details: err.message }) });
});

export default app;
