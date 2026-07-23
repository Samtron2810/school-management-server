import User from "../models/User.js";
import Parent from "../models/Parent.js";
import ParentStudent from "../models/ParentStudent.js";
import Enrollment from "../models/Enrollment.js";

import ApiError from "../utils/ApiError.js";
import withTransaction from "../utils/withTransaction.js";
import settingService from "./setting.service.js";
import { getCurrentAcademicContext } from "../utils/academicContext.js";

const createParent = async (data) => {
  // Auto-generate the parent ID when not supplied.
  const parentId = data.parentId?.trim()
    ? data.parentId.toUpperCase()
    : await settingService.generateId("parent");

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

    const existingParent = await Parent.findOne({ parentId }).session(session);

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
          parentId,
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

// Update a parent's profile AND their linked user account in one
// transaction, with uniqueness checks on parentId/email/username.
const updateParent = async (parentDocId, data) => {
  return await withTransaction(async (session) => {
    const parent = await Parent.findById(parentDocId).session(session);

    if (!parent) {
      throw new ApiError(404, "Parent not found.");
    }

    const user = await User.findById(parent.user).session(session);

    if (!user) {
      throw new ApiError(404, "Linked user account not found.");
    }

    if (data.parentId && data.parentId.toUpperCase() !== parent.parentId) {
      const conflict = await Parent.findOne({
        parentId: data.parentId.toUpperCase(),
      }).session(session);

      if (conflict) {
        throw new ApiError(400, "Parent ID already exists.");
      }

      parent.parentId = data.parentId.toUpperCase();
    }

    const nextEmail = data.email ? data.email.toLowerCase() : user.email;
    const nextUsername = data.username
      ? data.username.toLowerCase()
      : user.username;

    if (nextEmail !== user.email || nextUsername !== user.username) {
      const conflict = await User.findOne({
        _id: { $ne: user._id },
        $or: [{ email: nextEmail }, { username: nextUsername }],
      }).session(session);

      if (conflict) {
        throw new ApiError(400, "Email or username already exists.");
      }

      user.email = nextEmail;
      user.username = nextUsername;
    }

    for (const field of ["firstName", "lastName", "otherName"]) {
      if (data[field] !== undefined) user[field] = data[field];
    }

    if (data.phoneNumber !== undefined) {
      user.phoneNumber = data.phoneNumber;
    }

    for (const field of [
      "gender",
      "occupation",
      "workplace",
      "address",
      "isActive",
    ]) {
      if (data[field] !== undefined) parent[field] = data[field];
    }

    await user.save({ session });
    await parent.save({ session });

    return await Parent.findById(parent._id)
      .populate("user", "-password -refreshToken -__v")
      .session(session);
  });
};

// The signed-in parent's children roster — linked students with their
// user info, relationship, and current class (from the active enrollment).
const getMyChildren = async (user) => {
  const parent = await Parent.findOne({ user: user._id });

  if (!parent) {
    throw new ApiError(404, "Parent profile not found.");
  }

  const links = await ParentStudent.find({
    parent: parent._id,
    isActive: true,
  }).populate({
    path: "student",
    populate: {
      path: "user",
      select: "firstName lastName otherName username email avatar",
    },
  });

  // Current enrollment per child (best-effort — a missing academic
  // context or enrollment should never hide the children list).
  let currentSessionId = null;
  try {
    const context = await getCurrentAcademicContext();
    currentSessionId = context.session._id;
  } catch {
    currentSessionId = null;
  }

  const children = await Promise.all(
    links.map(async (link) => {
      let schoolClass = null;

      if (link.student && currentSessionId) {
        const enrollment = await Enrollment.findOne({
          student: link.student._id,
          session: currentSessionId,
          status: "Active",
        }).populate("schoolClass");

        schoolClass = enrollment?.schoolClass ?? null;
      }

      return {
        link: link._id,
        relationship: link.relationship,
        isPrimaryContact: link.isPrimaryContact,
        student: link.student,
        schoolClass,
      };
    }),
  );

  return children;
};

export default {
  createParent,
  getParents,
  getParentById,
  updateParent,
  getMyChildren,
};
