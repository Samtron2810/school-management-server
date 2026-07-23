import SchoolClass from "../models/SchoolClass.js";
import Enrollment from "../models/Enrollment.js";
import ClassSubject from "../models/ClassSubject.js";

import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";

const createClass = async (data) => {
  const existingClass = await SchoolClass.findOne({
    level: data.level,
    className: data.className,
    arm: data.arm,
  });

  if (existingClass) {
    throw new ApiError(400, "Class already exists.");
  }

  return await SchoolClass.create(data);
};

const getClasses = async () => {
  return await SchoolClass.find().sort({
    className: 1,
    arm: 1,
  });
};

const getClass = async (classId) => {
  return await findDocumentOrFail(SchoolClass, classId, "Class");
};

const updateClass = async (classId, data) => {
  const schoolClass = await findDocumentOrFail(SchoolClass, classId, "Class");

  const next = {
    level: data.level ?? schoolClass.level,
    className: data.className ?? schoolClass.className,
    arm: data.arm ?? schoolClass.arm,
  };

  const conflict = await SchoolClass.findOne({
    ...next,
    _id: { $ne: schoolClass._id },
  });

  if (conflict) {
    throw new ApiError(400, "A class with this name and arm already exists.");
  }

  for (const field of ["level", "className", "arm", "description", "isActive"]) {
    if (data[field] !== undefined) schoolClass[field] = data[field];
  }

  await schoolClass.save();

  return schoolClass;
};

const deleteClass = async (classId) => {
  const schoolClass = await findDocumentOrFail(SchoolClass, classId, "Class");

  const enrollment = await Enrollment.findOne({
    schoolClass: schoolClass._id,
  });
  if (enrollment) {
    throw new ApiError(
      400,
      "This class has enrollments and cannot be deleted.",
    );
  }

  const classSubject = await ClassSubject.findOne({
    schoolClass: schoolClass._id,
  });
  if (classSubject) {
    throw new ApiError(
      400,
      "This class has assigned subjects and cannot be deleted.",
    );
  }

  await schoolClass.deleteOne();
};

export default {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
};
