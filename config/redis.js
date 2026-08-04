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
//
// Uses SCAN rather than KEYS. KEYS walks the entire keyspace in one shot
// and blocks Redis's single event loop for the duration — fine on a
// handful of keys, but it's the wrong primitive for a call sitting on a
// hot invalidation path (this runs on every timetable write). SCAN walks
// the same keyspace in small non-blocking batches via a cursor, so other
// clients/queries aren't stalled while it runs.
export const cacheDelPattern = async (pattern) => {
  if (!redis) return;
  try {
    let cursor = "0";
    const matched = [];
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = nextCursor;
      matched.push(...keys);
    } while (cursor !== "0");

    if (matched.length > 0) await redis.del(...matched);
  } catch {
    // silent
  }
};

export default redis;
