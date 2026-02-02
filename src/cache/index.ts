import { env } from "@src/env";
import { Redis } from "@upstash/redis";

import type { SetCommandOptions } from "@upstash/redis";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN
});

async function cacheAdd<T>(key: string, value: T, options: SetCommandOptions = {}) {
  await redis.set(key, value, options);
}

async function cacheGet<T>(key: string): Promise<T | null> {
  return await redis.get(key);
}

async function cacheRemove(key: string) {
  await redis.del(key);
}

async function cacheKeys(pattern: string) {
  return await redis.keys(pattern);
}

async function cacheDelete(key: string) {
  await redis.del(key);
}

export { cacheGet, cacheAdd, cacheRemove, cacheKeys, cacheDelete };
