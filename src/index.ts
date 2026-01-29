import express from "express";

const app = express();

app.get("/", (_req, res) => {
  res.json({ message: "Hello from Bun on Vercel!" });
});

// Для локальной разработки через `bun run dev`
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Listening on ${PORT}`));
}

// Обязательно для Vercel
export default app;
