import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import env, { validateRequiredEnv } from "./config/env.js";
import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import logger from "./config/logger.js";
import cron from "node-cron";
import { runRetention } from "./services/retention.service.js";

import cookieParser from "cookie-parser";

import routes from "./routes/index.js";

import errorHandler from "./middlewares/error.middleware.js";
import notFound from "./middlewares/notFound.middleware.js";
import sanitizeRequest from "./middlewares/sanitize.middleware.js";
import { apiRateLimiter } from "./middlewares/rateLimiters.js";

const app = express();

validateRequiredEnv();

// Connect Database
await connectDB();

// Connect Redis (non-fatal — app runs fine without it)
connectRedis();

// Built-in Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "res.cloudinary.com"],
        // Allow the frontend origins to call the API
        connectSrc: ["'self'", ...env.CLIENT_ORIGINS],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: env.NODE_ENV === "production" ? [] : null,
      },
    },
  }),
);
app.use(compression());

// HTTP request logging — dev only
if (env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(
  cors({
    origin: env.CLIENT_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
    exposedHeaders: ["Content-Disposition"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(sanitizeRequest);

// Root Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TronSchool API is running",
  });
});

app.set("trust proxy", 1);

// Health Check Route
app.use("/api/v1", apiRateLimiter, routes);

// Not Found Middleware
app.use(notFound);
// Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(env.PORT, () => {
  logger.info(`Server running on http://localhost:${env.PORT}`);
});

// Data retention cron — runs daily at 02:00 server time.
// Policy: soft-deleted accounts purged after 30 days;
//         student academic records purged 7 years after last session.
if (env.NODE_ENV === "production") {
  cron.schedule("0 2 * * *", async () => {
    try {
      await runRetention();
    } catch (err) {
      logger.error({ type: "retention", event: "cron_error", error: err.message });
    }
  });
  logger.info("Data retention cron scheduled (daily 02:00).");
}

process.on("uncaughtException", (err) => {
  logger.error({ event: "uncaughtException", error: err.message, stack: err.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ event: "unhandledRejection", reason });
  process.exit(1);
});
