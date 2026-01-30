import express from "express";
import config from "#config.ts";

const app = express();

app.get("/", (_req, res) => {
  res.json({
    message: "Hello from Express on Vercel!",
    var: {
      NODE_ENV: process.env.NODE_ENV,
    },
    config: config,
  });
});

export default app;
