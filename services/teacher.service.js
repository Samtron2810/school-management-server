import User from "../models/User.js";
import Teacher from "../models/Teacher.js";

import ApiError from "../utils/ApiError.js";
import withTransaction from "../utils/withTransaction.js";
import settingService from "./setting.service.js";

const createTeacher = async (data) => {
  // Auto-generate the teacher ID from school settings when not supplied
  // (admins can still type the school's own numbering).
  const teacherId = data.teacherId?.trim()
    ? data.teacherId.toUpperCase()
    : await settingService.generateId("teacher");

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

    const existingTeacher = await Teacher.findOne({ teacherId }).session(
      session,
    );

    if (existingTeacher) {
      throw new ApiError(400, "Teacher ID already exists.");
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
          role: "teacher",
          phoneNumber: data.phoneNumber,
        },
      ],
      { session },
    );

    const [teacher] = await Teacher.create(
      [
        {
          user: user._id,
          teacherId,
          gender: data.gender,
          phoneNumber: data.phoneNumber,
          address: data.address,
          qualification: data.qualification,
          specialization: data.specialization,
          employmentDate: data.employmentDate,
          dateOfBirth: data.dateOfBirth,
        },
      ],
      { session },
    );

    return teacher;
  });
};

const getTeachers = async () => {
  return await Teacher.find()
    .populate("user", "-password -refreshToken -__v")
    .sort({ createdAt: -1 });
};

const getTeacher = async (teacherId) => {
  const teacher = await Teacher.findById(teacherId).populate(
    "user",
    "-password -refreshToken -__v",
  );

  if (!teacher) {
    throw new ApiError(404, "Teacher not found.");
  }

  return teacher;
};

// Update a teacher's profile AND their linked user account in one
// transaction, with uniqueness checks on teacherId/email/username.
const updateTeacher = async (teacherDocId, data) => {
  return await withTransaction(async (session) => {
    const teacher = await Teacher.findById(teacherDocId).session(session);

    if (!teacher) {
      throw new ApiError(404, "Teacher not found.");
    }

    const user = await User.findById(teacher.user).session(session);

    if (!user) {
      throw new ApiError(404, "Linked user account not found.");
    }

    if (
      data.teacherId &&
      data.teacherId.toUpperCase() !== teacher.teacherId
    ) {
      const conflict = await Teacher.findOne({
        teacherId: data.teacherId.toUpperCase(),
      }).session(session);

      if (conflict) {
        throw new ApiError(400, "Teacher ID already exists.");
      }

      teacher.teacherId = data.teacherId.toUpperCase();
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
      teacher.phoneNumber = data.phoneNumber;
    }

    for (const field of [
      "gender",
      "address",
      "qualification",
      "specialization",
      "employmentDate",
      "dateOfBirth",
      "isClassTeacher",
      "isActive",
    ]) {
      if (data[field] !== undefined) teacher[field] = data[field];
    }

    await user.save({ session });
    await teacher.save({ session });

    return await Teacher.findById(teacher._id)
      .populate("user", "-password -refreshToken -__v")
      .session(session);
  });
};

export default {
  createTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
};
