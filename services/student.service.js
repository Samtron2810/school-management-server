import User from "../models/User.js";
import Student from "../models/Student.js";

import ApiError from "../utils/ApiError.js";
import withTransaction from "../utils/withTransaction.js";
import settingService from "./setting.service.js";

const createStudent = async (data) => {
  // Auto-generate the admission number when not supplied.
  const admissionNumber = data.admissionNumber?.trim()
    ? data.admissionNumber.toUpperCase()
    : await settingService.generateId("student");

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

    const existingStudent = await Student.findOne({ admissionNumber }).session(
      session,
    );

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
          admissionNumber,
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

const getStudent = async (studentId) => {
  const student = await Student.findById(studentId).populate(
    "user",
    "-password -refreshToken -__v",
  );

  if (!student) {
    throw new ApiError(404, "Student not found.");
  }

  return student;
};

// Update a student's bio-data AND their linked user account in one
// transaction, with uniqueness checks on admissionNumber/email/username.
const updateStudent = async (studentDocId, data) => {
  return await withTransaction(async (session) => {
    const student = await Student.findById(studentDocId).session(session);

    if (!student) {
      throw new ApiError(404, "Student not found.");
    }

    const user = await User.findById(student.user).session(session);

    if (!user) {
      throw new ApiError(404, "Linked user account not found.");
    }

    if (
      data.admissionNumber &&
      data.admissionNumber.toUpperCase() !== student.admissionNumber
    ) {
      const conflict = await Student.findOne({
        admissionNumber: data.admissionNumber.toUpperCase(),
      }).session(session);

      if (conflict) {
        throw new ApiError(400, "Admission number already exists.");
      }

      student.admissionNumber = data.admissionNumber.toUpperCase();
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
      "dateOfBirth",
      "admissionDate",
      "address",
      "bloodGroup",
      "genotype",
      "nationality",
      "stateOfOrigin",
      "localGovernment",
      "religion",
      "isActive",
    ]) {
      if (data[field] !== undefined) student[field] = data[field];
    }

    await user.save({ session });
    await student.save({ session });

    return await Student.findById(student._id)
      .populate("user", "-password -refreshToken -__v")
      .session(session);
  });
};

export default {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
};
