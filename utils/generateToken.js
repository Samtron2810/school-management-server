import jwt from "jsonwebtoken";
import env from "../config/env.js";

const generateToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
};

export default generateToken;
