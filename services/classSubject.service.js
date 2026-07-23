import SchoolClass from "../models/SchoolClass.js";
import Subject from "../models/Subject.js";
import ClassSubject from "../models/ClassSubject.js";
import Lesson from "../models/Lesson.js";
import Assessment from "../models/Assessment.js";
import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";
import { getCurrentAcademicContext } from "../utils/academicContext.js";
import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";

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

const getClassSubject = async (classSubjectId) => {
  return await findDocumentOrFail(ClassSubject, classSubjectId, "ClassSubject", {
    populate: ["schoolClass", "subject"],
  });
};

// Repoint a class-subject pairing or toggle flags (duplicates guarded).
const updateClassSubject = async (classSubjectId, data) => {
  const classSubject = await findDocumentOrFail(
    ClassSubject,
    classSubjectId,
    "ClassSubject",
  );

  const nextClass = data.schoolClass ?? classSubject.schoolClass;
  const nextSubject = data.subject ?? classSubject.subject;

  if (
    nextClass.toString() !== classSubject.schoolClass.toString() ||
    nextSubject.toString() !== classSubject.subject.toString()
  ) {
    const conflict = await ClassSubject.findOne({
      schoolClass: nextClass,
      subject: nextSubject,
      _id: { $ne: classSubject._id },
    });

    if (conflict) {
      throw new ApiError(400, "Subject already assigned to this class.");
    }
  }

  classSubject.schoolClass = nextClass;
  classSubject.subject = nextSubject;

  for (const field of ["isCompulsory", "isActive"]) {
    if (data[field] !== undefined) classSubject[field] = data[field];
  }

  await classSubject.save();

  return await ClassSubject.findById(classSubject._id)
    .populate("schoolClass")
    .populate("subject");
};

const deleteClassSubject = async (classSubjectId) => {
  const classSubject = await findDocumentOrFail(
    ClassSubject,
    classSubjectId,
    "ClassSubject",
  );

  const lesson = await Lesson.findOne({ classSubject: classSubject._id });
  if (lesson) {
    throw new ApiError(
      400,
      "This class subject has lessons and cannot be deleted.",
    );
  }

  const assessment = await Assessment.findOne({
    classSubject: classSubject._id,
  });
  if (assessment) {
    throw new ApiError(
      400,
      "This class subject has assessments and cannot be deleted.",
    );
  }

  await classSubject.deleteOne();
};

// Student-scoped: the subjects attached to the student's current class.
const getMyClassSubjects = async (user) => {
  const student = await Student.findOne({ user: user._id });

  if (!student) {
    throw new ApiError(403, "Student profile not found.");
  }

  const { session } = await getCurrentAcademicContext();

  const enrollment = await Enrollment.findOne({
    student: student._id,
    session: session._id,
    status: "Active",
  });

  if (!enrollment) {
    throw new ApiError(404, "No active enrollment found for this student.");
  }

  return await ClassSubject.find({
    schoolClass: enrollment.schoolClass,
    isActive: true,
  })
    .populate("schoolClass")
    .populate("subject")
    .sort({ createdAt: -1 });
};

export default {
  createClassSubject,
  getClassSubjects,
  getClassSubject,
  updateClassSubject,
  deleteClassSubject,
  getMyClassSubjects,
};
