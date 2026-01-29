import { env } from "#env.ts";
import express from "express";

const app = express();

app.get("/", (_req, res) => {
  res.json({ message: "Hello from Express on Vercel!!" });
});

if (env.NODE_ENV !== "production") {
  const port = env.PORT ?? "4000";
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

export default app;
