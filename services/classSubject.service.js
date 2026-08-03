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
import withTransaction from "../utils/withTransaction.js";
import { cacheGet, cacheSet, cacheDel } from "../config/redis.js";

const CACHE_KEY = "classsubjects:list";
const CACHE_TTL = 300; // 5 min

const bust = () => cacheDel(CACHE_KEY);

const createClassSubject = async (data) => {
  const schoolClass = await SchoolClass.findById(data.schoolClass);
  if (!schoolClass) throw new ApiError(404, "Class not found.");

  const subject = await Subject.findById(data.subject);
  if (!subject) throw new ApiError(404, "Subject not found.");

  const existing = await ClassSubject.findOne({
    schoolClass: schoolClass._id,
    subject: subject._id,
  });
  if (existing) throw new ApiError(400, "Subject already assigned to this class.");

  const created = await ClassSubject.create({
    schoolClass: schoolClass._id,
    subject: subject._id,
    isCompulsory: data.isCompulsory,
  });
  await bust();
  return created;
};

const bulkCreateClassSubjects = async (data) => {
  const subjectIds = Array.isArray(data.subjects) ? data.subjects : [];
  if (subjectIds.length === 0) throw new ApiError(400, "At least one subject is required.");

  const result = await withTransaction(async (session) => {
    const schoolClass = await SchoolClass.findById(data.schoolClass).session(session);
    if (!schoolClass) throw new ApiError(404, "Class not found.");

    const created = [];

    for (const subjectId of subjectIds) {
      const subject = await Subject.findById(subjectId).session(session);
      if (!subject) throw new ApiError(404, `Subject not found: ${subjectId}`);

      const existing = await ClassSubject.findOne({
        schoolClass: schoolClass._id,
        subject: subject._id,
      }).session(session);
      if (existing) throw new ApiError(400, `${subject.name} is already assigned to this class.`);

      const [classSubject] = await ClassSubject.create(
        [{ schoolClass: schoolClass._id, subject: subject._id, isCompulsory: data.isCompulsory }],
        { session },
      );
      created.push(classSubject);
    }

    return created;
  });

  await bust();
  return result;
};

const getClassSubjects = async () => {
  const cached = await cacheGet(CACHE_KEY);
  if (cached) return cached;

  const list = await ClassSubject.find()
    .populate("schoolClass")
    .populate("subject")
    .sort({ createdAt: -1 })
    .lean();

  await cacheSet(CACHE_KEY, list, CACHE_TTL);
  return list;
};

const getClassSubject = async (classSubjectId) => {
  return await findDocumentOrFail(ClassSubject, classSubjectId, "ClassSubject", {
    populate: ["schoolClass", "subject"],
  });
};

const updateClassSubject = async (classSubjectId, data) => {
  const classSubject = await findDocumentOrFail(ClassSubject, classSubjectId, "ClassSubject");

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
    if (conflict) throw new ApiError(400, "Subject already assigned to this class.");
  }

  classSubject.schoolClass = nextClass;
  classSubject.subject = nextSubject;

  for (const field of ["isCompulsory", "isActive"]) {
    if (data[field] !== undefined) classSubject[field] = data[field];
  }

  await classSubject.save();
  await bust();

  return await ClassSubject.findById(classSubject._id).populate("schoolClass").populate("subject");
};

const deleteClassSubject = async (classSubjectId) => {
  const classSubject = await findDocumentOrFail(ClassSubject, classSubjectId, "ClassSubject");

  const lesson = await Lesson.findOne({ classSubject: classSubject._id });
  if (lesson) throw new ApiError(400, "This class subject has lessons and cannot be deleted.");

  const assessment = await Assessment.findOne({ classSubject: classSubject._id });
  if (assessment) throw new ApiError(400, "This class subject has assessments and cannot be deleted.");

  await classSubject.deleteOne();
  await bust();
};

const getMyClassSubjects = async (user) => {
  const student = await Student.findOne({ user: user._id });
  if (!student) throw new ApiError(403, "Student profile not found.");

  const { session } = await getCurrentAcademicContext();

  const enrollment = await Enrollment.findOne({
    student: student._id,
    session: session._id,
    status: "Active",
  });
  if (!enrollment) throw new ApiError(404, "No active enrollment found for this student.");

  return await ClassSubject.find({ schoolClass: enrollment.schoolClass, isActive: true })
    .populate("schoolClass")
    .populate("subject")
    .sort({ createdAt: -1 });
};

export default {
  createClassSubject,
  bulkCreateClassSubjects,
  getClassSubjects,
  getClassSubject,
  updateClassSubject,
  deleteClassSubject,
  getMyClassSubjects,
};
