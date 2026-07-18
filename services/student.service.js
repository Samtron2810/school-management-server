import User from "../models/User.js";
import Student from "../models/Student.js";

import ApiError from "../utils/ApiError.js";
import withTransaction from "../utils/withTransaction.js";

const createStudent = async (data) => {
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

    const existingStudent = await Student.findOne({
      admissionNumber: data.admissionNumber.toUpperCase(),
    }).session(session);

    if (existingStudent) {
      throw new ApiError(400, "Admission number already exists.");
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
          role: "student",
        },
      ],
      { session },
    );

    const [student] = await Student.create(
      [
        {
          user: user._id,
          admissionNumber: data.admissionNumber.toUpperCase(),
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          admissionDate: data.admissionDate,
          address: data.address,
          bloodGroup: data.bloodGroup,
          genotype: data.genotype,
          nationality: data.nationality,
          stateOfOrigin: data.stateOfOrigin,
          localGovernment: data.localGovernment,
          religion: data.religion,
        },
      ],
      { session },
    );

    return student;
  });
};

const getStudents = async () => {
  return await Student.find()
    .populate("user", "-password -refreshToken -__v")
    .sort({ createdAt: -1 });
};

export default {
  createStudent,
  getStudents,
};
