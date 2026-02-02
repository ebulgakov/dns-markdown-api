"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheGet = cacheGet;
exports.cacheAdd = cacheAdd;
exports.cacheRemove = cacheRemove;
exports.cacheKeys = cacheKeys;
exports.cacheDelete = cacheDelete;
const redis_1 = require("@upstash/redis");
const env_1 = require("../env");
const redis = new redis_1.Redis({
    url: env_1.env.UPSTASH_REDIS_REST_URL,
    token: env_1.env.UPSTASH_REDIS_REST_TOKEN
});
async function cacheAdd(key, value, options = {}) {
    await redis.set(key, value, options);
}
async function cacheGet(key) {
    return await redis.get(key);
}
async function cacheRemove(key) {
    await redis.del(key);
}
async function cacheKeys(pattern) {
    return await redis.keys(pattern);
}
async function cacheDelete(key) {
    await redis.del(key);
}
