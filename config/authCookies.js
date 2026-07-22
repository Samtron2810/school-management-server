import env from "./env.js";
import parseDuration from "../utils/parseDuration.js";

export const ACCESS_TOKEN_COOKIE_NAME = "accessToken";
export const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
export const CSRF_TOKEN_COOKIE_NAME = "csrfToken";

const baseCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
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
  sameSite: "strict",
  path: "/",
});

export const getClearCookieOptions = () => ({
  path: "/",
  sameSite: "strict",
  secure: env.NODE_ENV === "production",
});
