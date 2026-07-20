import jwt from "jsonwebtoken";
import env from "../config/env.js";

const generateToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn });
};

export default generateToken;
