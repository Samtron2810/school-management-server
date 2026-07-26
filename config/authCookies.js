import env from "./env.js";
import parseDuration from "../utils/parseDuration.js";

export const ACCESS_TOKEN_COOKIE_NAME = "accessToken";
export const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
export const CSRF_TOKEN_COOKIE_NAME = "csrfToken";

// Client (Vercel) and server (Render) are deployed on different domains in
// production, making every request cross-site. SameSite=Strict — and even
// Lax — are not sent on cross-site XHR/fetch calls, which silently broke
// the refresh-token flow: the browser just never sent the cookie back.
// SameSite=None is required for cross-site cookies, and browsers only honor
// it when Secure is also set (already true in production here).
// In development, client and server are same-site (localhost), so Lax is
// fine and doesn't require HTTPS.
const baseCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

export const getAccessTokenCookieOptions = () => ({
  ...baseCookieOptions,
  maxAge: parseDuration(env.ACCESS_TOKEN_EXPIRES_IN) ?? 15 * 60 * 1000,
});

export const getRefreshTokenCookieOptions = () => ({
  ...baseCookieOptions,
  maxAge: parseDuration(env.REFRESH_TOKEN_EXPIRES_IN) ?? 7 * 24 * 60 * 60 * 1000,
});

export const getCsrfCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
});

export const getClearCookieOptions = () => ({
  path: "/",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  secure: env.NODE_ENV === "production",
});
