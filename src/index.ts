import { app } from "./server.ts";
import { env } from "#env.ts";

const port = env.PORT;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export default app;
