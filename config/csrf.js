import { doubleCsrf } from "csrf-csrf";

import env from "./env.js";
import {
  CSRF_TOKEN_COOKIE_NAME,
  getCsrfCookieOptions,
} from "./authCookies.js";

const csrfUtilities = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  getSessionIdentifier: (req) =>
    req.cookies?.refreshToken ||
    req.user?._id?.toString() ||
    req.ip ||
    "anonymous",
  cookieName: CSRF_TOKEN_COOKIE_NAME,
  cookieOptions: getCsrfCookieOptions(),
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"],
  errorConfig: {
    statusCode: 403,
    message: "Invalid CSRF token.",
    code: "EBADCSRFTOKEN",
  },
});

export const csrfProtection = csrfUtilities.doubleCsrfProtection;
export const generateCsrfToken = csrfUtilities.generateCsrfToken;
export const validateCsrfToken = csrfUtilities.validateRequest;

export default csrfUtilities;
