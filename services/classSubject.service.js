import SchoolClass from "../models/SchoolClass.js";
import Subject from "../models/Subject.js";
import ClassSubject from "../models/ClassSubject.js";

import ApiError from "../utils/ApiError.js";

const createClassSubject = async (data) => {
  const schoolClass = await SchoolClass.findById(data.schoolClass);

  if (!schoolClass) {
    throw new ApiError(404, "Class not found.");
  }

  const subject = await Subject.findById(data.subject);

  if (!subject) {
    throw new ApiError(404, "Subject not found.");
  }

  const existing = await ClassSubject.findOne({
    schoolClass: schoolClass._id,
    subject: subject._id,
  });

  if (existing) {
    throw new ApiError(400, "Subject already assigned to this class.");
  }

  return await ClassSubject.create({
    schoolClass: schoolClass._id,
    subject: subject._id,
    isCompulsory: data.isCompulsory,
  });
};

const getClassSubjects = async () => {
  return await ClassSubject.find()
    .populate("schoolClass")
    .populate("subject")
    .sort({
      createdAt: -1,
    });
};

export default {
  createClassSubject,
  getClassSubjects,
};
