import User from "../models/User.js";
import Teacher from "../models/Teacher.js";

import ApiError from "../utils/ApiError.js";

const createTeacher = async (data) => {
  const existingUser = await User.findOne({
    $or: [
      { email: data.email.toLowerCase() },
      { username: data.username.toLowerCase() },
    ],
  });

  if (existingUser) {
    throw new ApiError(400, "Email or username already exists.");
  }

  const existingTeacher = await Teacher.findOne({
    teacherId: data.teacherId,
  });

  if (existingTeacher) {
    throw new ApiError(400, "Teacher ID already exists.");
  }

  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    otherName: data.otherName,
    username: data.username,
    email: data.email,
    password: data.password,
    role: "teacher",
    phoneNumber: data.phoneNumber,
  });

  const teacher = await Teacher.create({
    user: user._id,
    teacherId: data.teacherId,
    gender: data.gender,
    phoneNumber: data.phoneNumber,
    address: data.address,
    qualification: data.qualification,
    specialization: data.specialization,
    employmentDate: data.employmentDate,
    dateOfBirth: data.dateOfBirth,
  });

  return teacher;
};

export default {
  createTeacher,
};
