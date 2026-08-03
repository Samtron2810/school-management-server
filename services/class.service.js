import SchoolClass from "../models/SchoolClass.js";
import Enrollment from "../models/Enrollment.js";
import ClassSubject from "../models/ClassSubject.js";

import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";
import { cacheGet, cacheSet, cacheDel } from "../config/redis.js";

const CACHE_KEY = "classes:list";
const CACHE_TTL = 300; // 5 min

const createClass = async (data) => {
  const existingClass = await SchoolClass.findOne({
    level: data.level,
    className: data.className,
    arm: data.arm,
  });

  if (existingClass) throw new ApiError(400, "Class already exists.");

  const created = await SchoolClass.create(data);
  await cacheDel(CACHE_KEY);
  return created;
};

const getClasses = async () => {
  const cached = await cacheGet(CACHE_KEY);
  if (cached) return cached;

  const classes = await SchoolClass.find().sort({ className: 1, arm: 1 }).lean();
  await cacheSet(CACHE_KEY, classes, CACHE_TTL);
  return classes;
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

  const conflict = await SchoolClass.findOne({ ...next, _id: { $ne: schoolClass._id } });
  if (conflict) throw new ApiError(400, "A class with this name and arm already exists.");

  for (const field of ["level", "className", "arm", "description", "isActive"]) {
    if (data[field] !== undefined) schoolClass[field] = data[field];
  }

  await schoolClass.save();
  await cacheDel(CACHE_KEY);
  return schoolClass;
};

const deleteClass = async (classId) => {
  const schoolClass = await findDocumentOrFail(SchoolClass, classId, "Class");

  const enrollment = await Enrollment.findOne({ schoolClass: schoolClass._id });
  if (enrollment) throw new ApiError(400, "This class has enrollments and cannot be deleted.");

  const classSubject = await ClassSubject.findOne({ schoolClass: schoolClass._id });
  if (classSubject) throw new ApiError(400, "This class has assigned subjects and cannot be deleted.");

  await schoolClass.deleteOne();
  await cacheDel(CACHE_KEY);
};

export default { createClass, getClasses, getClass, updateClass, deleteClass };
