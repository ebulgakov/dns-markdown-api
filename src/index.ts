import express from 'express';
const app = express();
const port = process.env.PORT ?? "4000";

app.get('/', (_req, res) => {
  res.json({ message: 'Hello from Express on Vercel!' });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
