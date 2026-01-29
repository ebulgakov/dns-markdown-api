import { app } from "#src/server.ts";

import { env } from "#env.ts";

if (env.NODE_ENV !== "production") {
  const PORT = env.PORT || 3000;
  app.listen(PORT, () => console.log(`Listening on ${PORT}`));
}

export default app;
