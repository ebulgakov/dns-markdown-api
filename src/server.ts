import express from "express";
const app = express();

app.get("/", (_req, res) => {
  res.json({ message: "Hello from Express on Vercel!" });
});

export default app;
