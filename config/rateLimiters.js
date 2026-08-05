import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { getRedis } from "./redis.js";

// A single RedisStore whose sendCommand resolves the client lazily at request
// time — after connectRedis() has run — rather than at module import time.
// If Redis is not yet connected, getRedis() returns null and the command is a
// no-op, which causes express-rate-limit to fall back to its MemoryStore.
const makeLazyStore = (prefix) =>
  new RedisStore({
    prefix,
    sendCommand: (...args) => {
      const redis = getRedis();
      if (!redis) return Promise.resolve(null);
      return redis.call(...args);
    },
  });

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS" || req.method === "GET",
  store: makeLazyStore("rl:api:"),
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

export const heavyReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  store: makeLazyStore("rl:heavy:"),
  message: {
    success: false,
    message: "Too many requests on this endpoint, please slow down.",
  },
});

const createAuthRateLimiter = (message, prefix) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    store: makeLazyStore(prefix),
    message: { success: false, message },
  });

export const loginRateLimiter = createAuthRateLimiter(
  "Too many login attempts, please try again later.",
  "rl:login:",
);

export const passwordChangeRateLimiter = createAuthRateLimiter(
  "Too many password change attempts, please try again later.",
  "rl:pwchange:",
);

export const authRateLimiter = loginRateLimiter;
