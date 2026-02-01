import * as Sentry from "@sentry/node";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env, isDev, isTestEnv } from "../env";
// @ts-expect-error - fix vercel declaration issue
import { clerkMiddleware } from "../vendors/clerk-express";

import analysisRoutes from "./analysis-routes";
import clerkRoutes from "./clerk-routes";
import { authMiddleware } from "./middleware/auth-middleware";
import { ensureDbConnectionMiddleware } from "./middleware/db-connection-middleware";
import { serviceMiddleware } from "./middleware/service-middleware";
import priceListRoutes from "./pricelist-routes";
import productsRoutes from "./products-routes";
import serviceRoutes from "./service-routes";
import userActionsRoutes from "./user-actions-routes";
import userRoutes from "./user-routes";

import "../instrument";

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

// Set limit to 20MB
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Use a raw body parser for the Cleak webhook route
app.use("/clerk/create-user", express.raw({ type: "application/json" }));

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
app.use("/user-actions", clerkMiddleware());

app.use("/api/pricelist", priceListRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/user", userRoutes);
app.use("/user-actions", userActionsRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/clerk", clerkRoutes);

app.use("/service", serviceMiddleware);
app.use("/service", serviceRoutes);

Sentry.setupExpressErrorHandler(app);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal Server Error", ...(isDev() && { details: err.message }) });
});

export default app;
