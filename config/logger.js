import { createLogger, format, transports } from "winston";
import env from "./env.js";

const { combine, timestamp, errors, json, colorize, simple } = format;

// Production: structured JSON (parseable by Render log drain)
// Development: human-readable colorised output
const logger = createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new transports.Console({
      format:
        env.NODE_ENV === "production"
          ? combine(timestamp(), errors({ stack: true }), json())
          : combine(colorize(), simple()),
    }),
  ],
});

// ─── Security event helpers ───────────────────────────────────────────────────
// These should be called from controllers/services for audit-trail events.
// Never log passwords, tokens, or payment info.

export const logSecurityEvent = (event, meta = {}) => {
  logger.info({ type: "security", event, ...meta });
};

export const logAuthEvent = (event, { userId, username, role, ip } = {}) => {
  logger.info({ type: "auth", event, userId, username, role, ip });
};

export const logAdminAction = (action, { adminId, target, detail } = {}) => {
  logger.info({ type: "admin_action", action, adminId, target, detail });
};

export default logger;
