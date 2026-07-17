import express from "express";

import env from "./config/env.js";
import connectDB from "./config/db.js";

import cookieParser from "cookie-parser";

import routes from "./routes/index.js";

import errorHandler from "./middlewares/error.middleware.js";
import notFound from "./middlewares/notFound.middleware.js";

const app = express();

// Connect Database
await connectDB();

// Built-in Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// Health Check Route
app.use("/api/v1", routes);

// Not Found Middleware
app.use(notFound);
// Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
