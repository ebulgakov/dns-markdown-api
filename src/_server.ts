import express from "express";
import cors from "cors";

import { env } from "#env.ts";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);

app.get("/", (_req, res) => {
  res.json({ message: "Hello from Express on Vercel!!" });
});

export { app };
