import crypto from "crypto";

const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a raw token + its SHA-256 hash.
 * Store the HASH in the DB; send the RAW token to the user.
 */
export const generateResetToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + EXPIRY_MS);
  return { raw, hash, expiresAt };
};

/**
 * Hash a raw token received from the user to compare against the stored hash.
 */
export const hashResetToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");
