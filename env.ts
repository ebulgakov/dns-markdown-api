import * as dotenv from "dotenv";
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";
const isDev = process.env.NODE_ENV === "development";
const isTestEnv = process.env.NODE_ENV === "test";

if (isDev) {
  dotenv.config({ path: ".env.development" });
} else if (isTestEnv) {
  dotenv.config({ path: ".env.test" });
} else if (isProd) {
  dotenv.config({ path: ".env.production" });
}

const envSchema = z.object({
  PORT: z.string().default("4000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  DATABASE_URL: z.string().startsWith("mongodb+srv://"),

  // CORS
  CORS_ORIGIN: z
    .string()
    .or(z.array(z.string()))
    .transform(val => {
      if (typeof val === "string") {
        return val.split(",").map(origin => origin.trim());
      }
      return val;
    })
    .default([])
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("❌ Invalid environment variables:");
    const { fieldErrors } = z.flattenError(error);
    console.error(JSON.stringify(fieldErrors, null, 2));

    // More detailed error messages
    error.issues.forEach(err => {
      const path = err.path.join(".");
      console.error(`  ${path}: ${err.message}`);
    });

    process.exit(1);
  }
  console.error(error);
  throw error;
}

export { env };
