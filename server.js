import express from "express";
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";

import env, { validateRequiredEnv } from "./config/env.js";
import connectDB from "./config/db.js";

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

// Built-in Middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(mongoSanitize());
app.use(sanitizeRequest);

app.set("trust proxy", 1);

// Health Check Route
app.use("/api/v1", apiRateLimiter, routes);

// Not Found Middleware
app.use(notFound);
// Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
