import rateLimit from "express-rate-limit";

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: {
    success: false,
    message: "Too many requests, please try again later.",
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
