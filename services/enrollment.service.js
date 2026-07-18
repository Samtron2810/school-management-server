import Enrollment from "../models/Enrollment.js";
import Student from "../models/Student.js";
import Session from "../models/Session.js";
import Term from "../models/Term.js";
import SchoolClass from "../models/SchoolClass.js";

import ApiError from "../utils/ApiError.js";

const createEnrollment = async (data) => {
  const student = await Student.findById(data.student);

  if (!student) {
    throw new ApiError(404, "Student not found.");
  }

  const currentSession = await Session.findOne({
    isCurrent: true,
  });

  if (!currentSession) {
    throw new ApiError(400, "No active session found.");
  }

  const currentTerm = await Term.findOne({
    session: currentSession._id,
    isCurrent: true,
  });

  if (!currentTerm) {
    throw new ApiError(400, "No active term found.");
  }

  const schoolClass = await SchoolClass.findById(data.schoolClass);

  if (!schoolClass) {
    throw new ApiError(404, "Class not found.");
  }

  const existingEnrollment = await Enrollment.findOne({
    student: student._id,
    session: currentSession._id,
    term: currentTerm._id,
  });

  if (existingEnrollment) {
    throw new ApiError(
      400,
      "Student is already enrolled for the current term.",
    );
  }

  return await Enrollment.create({
    student: student._id,
    session: currentSession._id,
    term: currentTerm._id,
    schoolClass: schoolClass._id,
    rollNumber: data.rollNumber,
    enrollmentNumber: data.enrollmentNumber,
  });
};

const getEnrollments = async () => {
  return await Enrollment.find()
    .populate({
      path: "student",
      populate: {
        path: "user",
        select: "firstName lastName otherName",
      },
    })
    .populate("schoolClass")
    .populate("session", "name")
    .populate("term", "name")
    .sort({
      createdAt: -1,
    });
};

export default {
  createEnrollment,
  getEnrollments,
};
