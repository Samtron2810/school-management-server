import Teacher from "../models/Teacher.js";
import Subject from "../models/Subject.js";
import SchoolClass from "../models/SchoolClass.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import ClassSubject from "../models/ClassSubject.js";

import ApiError from "../utils/ApiError.js";

import { getCurrentAcademicContext } from "../utils/academicContext.js";

const classSubject = await ClassSubject.findOne({
  schoolClass: schoolClass._id,
  subject: subject._id,
});

if (!classSubject) {
  throw new ApiError(
    400,
    "This subject is not assigned to the selected class.",
  );
}

const createTeacherAssignment = async (data) => {
  const { session, term } = await getCurrentAcademicContext();

  const teacher = await Teacher.findById(data.teacher);

  if (!teacher) {
    throw new ApiError(404, "Teacher not found.");
  }

  const subject = await Subject.findById(data.subject);

  if (!subject) {
    throw new ApiError(404, "Subject not found.");
  }

  const schoolClass = await SchoolClass.findById(data.schoolClass);

  if (!schoolClass) {
    throw new ApiError(404, "Class not found.");
  }

  const existingAssignment = await TeacherAssignment.findOne({
    subject: subject._id,
    schoolClass: schoolClass._id,
    session: session._id,
    term: term._id,
  });

  if (existingAssignment) {
    throw new ApiError(
      400,
      "This subject has already been assigned to a teacher for this class in the current term.",
    );
  }

  return await TeacherAssignment.create({
    teacher: teacher._id,
    subject: subject._id,
    schoolClass: schoolClass._id,
    session: session._id,
    term: term._id,
  });
};

const getTeacherAssignments = async () => {
  return await TeacherAssignment.find()
    .populate({
      path: "teacher",
      populate: {
        path: "user",
        select: "firstName lastName otherName",
      },
    })
    .populate("subject", "name code")
    .populate("schoolClass")
    .populate("session", "name")
    .populate("term", "name")
    .sort({
      createdAt: -1,
    });
};

export default {
  createTeacherAssignment,
  getTeacherAssignments,
};
