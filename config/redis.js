import Redis from "ioredis";
import env from "./env.js";

let redis = null;

export const connectRedis = () => {
  if (!env.REDIS_URL) {
    console.warn("[Redis] REDIS_URL not set — caching disabled.");
    return null;
  }

  redis = new Redis(env.REDIS_URL, {
    tls: env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    lazyConnect: false,
  });

  redis.on("connect", () => console.log("[Redis] Connected."));
  redis.on("error", (err) => console.error("[Redis] Error:", err.message));
  redis.on("reconnecting", () => console.log("[Redis] Reconnecting..."));

  return redis;
};

export const getRedis = () => redis;

// Safe wrappers — if Redis is down, fall through to DB silently.
export const cacheGet = async (key) => {
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = 60) => {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // silent
  }
};

export const cacheDel = async (...keys) => {
  if (!redis) return;
  try {
    await redis.del(...keys);
  } catch {
    // silent
  }
};

// Delete all keys matching a pattern e.g. "timetable:class:*"
export const cacheDelPattern = async (pattern) => {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // silent
  }
};

export default redis;
