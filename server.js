import express from "express";

import connectDB from "./config/db.js";
import env from "./config/env.js";

const app = express();

// Connect Database
await connectDB();

// Built-in Middleware
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to TronSchool API",
  });
});

// Start Server
app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
