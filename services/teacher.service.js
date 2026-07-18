import User from "../models/User.js";
import Teacher from "../models/Teacher.js";

import ApiError from "../utils/ApiError.js";
import withTransaction from "../utils/withTransaction.js";

const createTeacher = async (data) => {
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

    const existingTeacher = await Teacher.findOne({
      teacherId: data.teacherId.toUpperCase(),
    }).session(session);

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
          teacherId: data.teacherId.toUpperCase(),
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

export default {
  createTeacher,
  getTeachers,
};
