import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { whenRedisReady } from "./redis.js";

// The stores are created at import time, before connectRedis() has run, and
// the store loads its Lua script immediately. So sendCommand waits until the
// client is ready instead of answering null (which made the store's init
// throw "unexpected reply from redis client"). With Redis disabled it
// resolves null and the limiter falls back to passOnStoreError below.
const makeLazyStore = (prefix) =>
  new RedisStore({
    prefix,
    sendCommand: async (...args) => {
      const redis = await whenRedisReady();
      if (!redis) throw new Error("Redis unavailable");
      return redis.call(...args);
    },
  });

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // per IP — a whole school can share one Wi-Fi address
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS" || req.method === "GET",
  passOnStoreError: true, // never block requests because Redis hiccuped
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
  passOnStoreError: true, // never block requests because Redis hiccuped
  store: makeLazyStore("rl:heavy:"),
  message: {
    success: false,
    message: "Too many requests on this endpoint, please slow down.",
  },
});

const createAuthRateLimiter = (message, prefix, { failedOnly = false } = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    skipSuccessfulRequests: failedOnly,
    passOnStoreError: true, // never block requests because Redis hiccuped
    store: makeLazyStore(prefix),
    message: { success: false, message },
  });

export const loginRateLimiter = createAuthRateLimiter(
  "Too many login attempts, please try again later.",
  "rl:login:",
  { failedOnly: true }, // good logins don't count — only wrong passwords
);

export const passwordChangeRateLimiter = createAuthRateLimiter(
  "Too many password change attempts, please try again later.",
  "rl:pwchange:",
);

export const authRateLimiter = loginRateLimiter;
