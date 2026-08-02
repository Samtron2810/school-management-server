import rateLimit from "express-rate-limit";

// General API limiter — covers all mutating requests (POST/PUT/PATCH/DELETE).
// GET requests are excluded here because they are handled by more specific
// limiters below (heavyReadLimiter, dashboardLimiter) or are cheap enough
// not to need limiting at the global level.
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS" || req.method === "GET",
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

// Applied to expensive GET endpoints: dashboard, report cards, attendance
// summary, results. These hit many collections and/or generate PDFs.
// 60 requests per 15 min ≈ 4/min per IP — plenty for normal use.
export const heavyReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
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
    message: {
      success: false,
      message,
    },
  });

export const loginRateLimiter = createAuthRateLimiter(
  "Too many login attempts, please try again later.",
);

export const passwordChangeRateLimiter = createAuthRateLimiter(
  "Too many password change attempts, please try again later.",
);

export const authRateLimiter = loginRateLimiter;
