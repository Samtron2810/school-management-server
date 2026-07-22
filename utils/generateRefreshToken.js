import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import env from "../config/env.js";

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      tokenVersion: user.tokenVersion ?? 0,
      tokenType: "refresh",
      jti: randomUUID(),
    },
    env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    },
  );
};

export default generateRefreshToken;
