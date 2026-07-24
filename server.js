import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
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
app.use(compression());

if (env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

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
  console.log(`Server running on http://localhost:${env.PORT}`);
});
