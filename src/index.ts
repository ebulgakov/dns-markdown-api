import express from "express";

import { env } from "#env.ts";

const app = express();

app.get("/", (_req, res) => {
  res.json({ message: "Hello from Bun on Vercel!" });
});

// Для локальной разработки через `bun run dev`
if (env.NODE_ENV !== "production") {
  const PORT = env.PORT || 3000;
  app.listen(PORT, () => console.log(`Listening on ${PORT}`));
}

// Обязательно для Vercel
export default app;
