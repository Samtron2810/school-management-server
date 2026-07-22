import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import env from "../config/env.js";

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
      tokenType: "access",
      jti: randomUUID(),
    },
    env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
    },
  );
};

export default generateAccessToken;
