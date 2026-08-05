import dotenv from "dotenv";

dotenv.config();

const parseOrigins = (value) => {
  if (!value) {
    return ["http://localhost:3000", "http://localhost:5173"];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,

  MONGO_URI: process.env.MONGO_URI,

  REDIS_URL: process.env.REDIS_URL || null,

  CLIENT_ORIGINS: parseOrigins(process.env.CLIENT_ORIGINS),

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,

  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,

  CSRF_SECRET: process.env.CSRF_SECRET,

  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME,
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
};

export const validateRequiredEnv = () => {
  const required = [
    "MONGO_URI",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
    "CSRF_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "ACCESS_TOKEN_EXPIRES_IN",
    "REFRESH_TOKEN_EXPIRES_IN",
    "BREVO_API_KEY",
    "BREVO_SENDER_EMAIL",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      "Missing required environment variables:\n" +
        missing.map((key) => `- ${key}`).join("\n"),
    );
    process.exit(1);
  }

  if (!process.env.REDIS_URL) {
    console.warn("[Env] REDIS_URL not set — Redis caching will be disabled.");
  }
};

export default env;
