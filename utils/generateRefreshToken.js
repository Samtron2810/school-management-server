import jwt from "jsonwebtoken";
import env from "../config/env.js";

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    },
  );
};

export default generateRefreshToken;
