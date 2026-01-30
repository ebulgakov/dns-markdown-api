import app from "./server.ts";

if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT ?? "4000";
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

export default app;
