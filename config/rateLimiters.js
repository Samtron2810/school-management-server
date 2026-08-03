import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { getRedis } from "./redis.js";

// Build the rate limit store — Redis if available, memory fallback otherwise.
// Must be a function so it's evaluated after Redis has connected (at request
// time, not at import time).
const makeStore = () => {
  const redis = getRedis();
  if (!redis) return undefined; // falls back to express-rate-limit MemoryStore

  return new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  });
};

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS" || req.method === "GET",
  store: makeStore(),
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
  store: makeStore(),
  message: {
    success: false,
    message: "Too many requests on this endpoint, please slow down.",
  },
});

const createAuthRateLimiter = (message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    store: makeStore(),
    message: { success: false, message },
  });

export const loginRateLimiter = createAuthRateLimiter(
  "Too many login attempts, please try again later.",
);

export const passwordChangeRateLimiter = createAuthRateLimiter(
  "Too many password change attempts, please try again later.",
);

export const authRateLimiter = loginRateLimiter;
