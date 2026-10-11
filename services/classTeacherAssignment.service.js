import Teacher from "../models/Teacher.js";
import SchoolClass from "../models/SchoolClass.js";
import ClassTeacherAssignment from "../models/ClassTeacherAssignment.js";

import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";

import { getCurrentSession } from "../utils/academicContext.js";

const assignClassTeacher = async (data) => {
  const session = await getCurrentSession();

  const teacher = await Teacher.findById(data.teacher);

  if (!teacher) {
    throw new ApiError(404, "Teacher not found.");
  }

  const schoolClass = await SchoolClass.findById(data.schoolClass);

  if (!schoolClass) {
    throw new ApiError(404, "Class not found.");
  }

  const classAlreadyAssigned = await ClassTeacherAssignment.findOne({
    schoolClass: schoolClass._id,
    session: session._id,
  });

  if (classAlreadyAssigned) {
    throw new ApiError(400, "This class already has a class teacher.");
  }

  const teacherAlreadyAssigned = await ClassTeacherAssignment.findOne({
    teacher: teacher._id,
    session: session._id,
  });

  if (teacherAlreadyAssigned) {
    throw new ApiError(
      400,
      "This teacher is already assigned as a class teacher.",
    );
  }

  return await ClassTeacherAssignment.create({
    teacher: teacher._id,
    schoolClass: schoolClass._id,
    session: session._id,
  });
};

const getClassTeacherAssignments = async () => {
  return await ClassTeacherAssignment.find()
    .populate({
      path: "teacher",
      populate: {
        path: "user",
        select: "firstName lastName otherName",
      },
    })
    .populate("schoolClass")
    .populate("session", "name")
    .sort({
      createdAt: -1,
    });
};

// Replace the teacher of an existing assignment (resignation, leave, etc).
const updateClassTeacherAssignment = async (assignmentId, data) => {
  const assignment = await findDocumentOrFail(
    ClassTeacherAssignment,
    assignmentId,
    "Class teacher assignment",
  );

  if (data.teacher) {
    const teacher = await Teacher.findById(data.teacher);

    if (!teacher) {
      throw new ApiError(404, "Teacher not found.");
    }

    const teacherBusy = await ClassTeacherAssignment.findOne({
      _id: { $ne: assignment._id },
      teacher: teacher._id,
      session: assignment.session,
    });

    if (teacherBusy) {
      throw new ApiError(
        400,
        "This teacher is already assigned as a class teacher.",
      );
    }

    assignment.teacher = teacher._id;
  }

  if (data.isActive !== undefined) {
    assignment.isActive = data.isActive;
  }

  await assignment.save();

  return assignment;
};

const deleteClassTeacherAssignment = async (assignmentId) => {
  const assignment = await findDocumentOrFail(
    ClassTeacherAssignment,
    assignmentId,
    "Class teacher assignment",
  );

  await assignment.deleteOne();
};

export default {
  assignClassTeacher,
  getClassTeacherAssignments,
  updateClassTeacherAssignment,
  deleteClassTeacherAssignment,
};
