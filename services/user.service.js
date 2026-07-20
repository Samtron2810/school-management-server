import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

const createUser = async (data) => {
  const existing = await User.findOne({
    $or: [
      { email: data.email.toLowerCase() },
      { username: data.username.toLowerCase() },
    ],
  });

  if (existing) {
    throw new ApiError(
      400,
      "A user with this email or username already exists.",
    );
  }

  return await User.create({
    ...data,
    email: data.email.toLowerCase(),
    username: data.username.toLowerCase(),
  });
};

const getUsers = async () => {
  return await User.find().sort({ createdAt: -1 });
};

export default {
  createUser,
  getUsers,
};
