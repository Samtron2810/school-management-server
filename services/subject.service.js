import Subject from "../models/Subject.js";
import ClassSubject from "../models/ClassSubject.js";
import TeacherAssignment from "../models/TeacherAssignment.js";

import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";

const createSubject = async (data) => {
  const existingSubject = await Subject.findOne({
    $or: [
      {
        name: data.name,
      },
      {
        code: data.code.toUpperCase(),
      },
    ],
  });

  if (existingSubject) {
    throw new ApiError(400, "Subject already exists.");
  }

  return await Subject.create({
    ...data,
    code: data.code.toUpperCase(),
  });
};

const getSubjects = async () => {
  return await Subject.find().sort({
    name: 1,
  });
};

const getSubject = async (subjectId) => {
  return await findDocumentOrFail(Subject, subjectId, "Subject");
};

const updateSubject = async (subjectId, data) => {
  const subject = await findDocumentOrFail(Subject, subjectId, "Subject");

  const nextName = data.name ?? subject.name;
  const nextCode = data.code ? data.code.toUpperCase() : subject.code;

  if (nextName !== subject.name || nextCode !== subject.code) {
    const conflict = await Subject.findOne({
      _id: { $ne: subject._id },
      $or: [{ name: nextName }, { code: nextCode }],
    });

    if (conflict) {
      throw new ApiError(400, "A subject with this name or code already exists.");
    }
  }

  subject.name = nextName;
  subject.code = nextCode;

  await subject.save();

  return subject;
};

const deleteSubject = async (subjectId) => {
  const subject = await findDocumentOrFail(Subject, subjectId, "Subject");

  const classSubject = await ClassSubject.findOne({ subject: subject._id });
  if (classSubject) {
    throw new ApiError(
      400,
      "This subject is assigned to classes and cannot be deleted.",
    );
  }

  const assignment = await TeacherAssignment.findOne({
    subject: subject._id,
  });
  if (assignment) {
    throw new ApiError(
      400,
      "This subject has teacher assignments and cannot be deleted.",
    );
  }

  await subject.deleteOne();
};

export default {
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
};
