import * as dotenv from "dotenv";
import { z } from "zod";

export const isProd = () => process.env.NODE_ENV === "production";
export const isDev = () => process.env.NODE_ENV === "development";
export const isTestEnv = () => process.env.NODE_ENV === "test";

if (isDev()) {
  dotenv.config({ path: ".env.development" });
} else if (isTestEnv()) {
  dotenv.config({ path: ".env.test" });
} else if (isProd()) {
  dotenv.config({ path: ".env.production" });
}

const envSchema = z.object({
  CITY: z.string().default("samara"),
  API_AUTH_SECRET: z.string().min(10, "API_AUTH_SECRET must be at least 10 characters long"),
  PORT: z.string().default("4000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().startsWith("mongodb+srv://"),
  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(10, "UPSTASH_REDIS_REST_TOKEN must be at least 10 characters long"),

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
  console.error("⚠️  Environment variable validation error:", process.env);
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
