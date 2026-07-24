import User from "../models/User.js";
import Parent from "../models/Parent.js";

import ApiError from "../utils/ApiError.js";
import withTransaction from "../utils/withTransaction.js";

const createParent = async (data) => {
  return await withTransaction(async (session) => {
    const existingUser = await User.findOne({
      $or: [
        { email: data.email.toLowerCase() },
        { username: data.username.toLowerCase() },
      ],
    }).session(session);

    if (existingUser) {
      throw new ApiError(400, "Email or username already exists.");
    }

    const existingParent = await Parent.findOne({
      parentId: data.parentId.toUpperCase(),
    }).session(session);

    if (existingParent) {
      throw new ApiError(400, "Parent ID already exists.");
    }

    const [user] = await User.create(
      [
        {
          firstName: data.firstName,
          lastName: data.lastName,
          otherName: data.otherName,
          username: data.username.toLowerCase(),
          email: data.email.toLowerCase(),
          password: data.password,
          phoneNumber: data.phoneNumber,
          role: "parent",
        },
      ],
      { session },
    );

    const [parent] = await Parent.create(
      [
        {
          user: user._id,
          parentId: data.parentId.toUpperCase(),
          gender: data.gender,
          occupation: data.occupation,
          workplace: data.workplace,
          address: data.address,
        },
      ],
      { session },
    );

    return parent;
  });
};

const getParents = async () => {
  return await Parent.find()
    .populate("user", "-password -refreshToken -__v")
    .sort({
      createdAt: -1,
    });
};

const getParentById = async (id) => {
  const parent = await Parent.findById(id).populate(
    "user",
    "-password -refreshToken -__v",
  );

  if (!parent) {
    throw new ApiError(404, "Parent not found.");
  }

  return parent;
};

export default {
  createParent,
  getParents,
  getParentById,
};
