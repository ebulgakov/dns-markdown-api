import express from "express";
import { env } from "../env";

const app = express();

app.get("/", (_req, res) => {
  res.json({
    message: "Hello from Express on Vercel!",
    var: {
      NODE_ENV: env.NODE_ENV
    },
    env: env
  });
});

export default app;
