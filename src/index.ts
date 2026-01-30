import app from "./server.ts";
import { env } from "~/env";

if (env.NODE_ENV !== "production") {
  app.listen(env.PORT, () => console.log(`Listening on ${env.PORT}`));
}

export default app;
