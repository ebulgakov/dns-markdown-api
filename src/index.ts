import { dbConnect, dbDisconnect } from "../db/database.ts";
import { env } from "../env";

import app from "./server.ts";

import type { Server } from "http";

dbConnect()
  .then(() => {
    console.log("Database connected successfully");
    let server: Server;

    if (env.NODE_ENV !== "production") {
      server = app.listen(env.PORT, () => console.log(`Listening on ${env.PORT}`));
    }

    process.on("SIGINT", async () => {
      console.log("Shutting down server...");
      await dbDisconnect();
      server?.close(() => {
        console.log("Server shut down.");
        process.exit(0);
      });
    });
  })
  .catch(err => {
    console.error("Database connection failed", err);
    process.exit(1);
  });

export default app;
