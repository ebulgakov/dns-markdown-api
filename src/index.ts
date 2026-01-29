import { app } from "./server.ts";
import { env } from "#env.ts";

if (env.NODE_ENV !== "production") {
  const port = env.PORT ?? "4000";
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

export default app;
