import { createHash } from "crypto";
import jwt from "jsonwebtoken";

// One refresh-token "session" per signed-in browser/device, so the same
// account can be used by many people at once. (Before, a single hash was
// stored per user: every new login replaced it and logged the others out.)
const MAX_SESSIONS = 25; // oldest are dropped past this

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

export const addSession = (user, refreshToken) => {
  const jti = jwt.decode(refreshToken)?.jti;
  const sessions = [...(user.sessions || [])];
  sessions.push({ jti, hash: sha256(refreshToken), updatedAt: new Date() });
  user.sessions = sessions.slice(-MAX_SESSIONS);
  user.refreshToken = undefined; // legacy single-token field
};

export const findSession = (user, refreshToken) => {
  const jti = jwt.decode(refreshToken)?.jti;
  const hash = sha256(refreshToken);
  return (user.sessions || []).find((s) => s.jti === jti && s.hash === hash);
};

// Swap the old session's token for the new one (rotation).
export const rotateSession = (user, oldToken, newToken) => {
  const oldJti = jwt.decode(oldToken)?.jti;
  const newJti = jwt.decode(newToken)?.jti;
  user.sessions = (user.sessions || []).map((s) =>
    s.jti === oldJti
      ? { jti: newJti, hash: sha256(newToken), updatedAt: new Date() }
      : s,
  );
  user.refreshToken = undefined;
};

export const removeSession = (user, refreshToken) => {
  const jti = jwt.decode(refreshToken)?.jti;
  user.sessions = (user.sessions || []).filter((s) => s.jti !== jti);
};

export const clearSessions = (user) => {
  user.sessions = [];
  user.refreshToken = undefined;
};
