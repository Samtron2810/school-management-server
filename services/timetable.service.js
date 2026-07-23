import Timetable from "../models/Timetable.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import ClassSubject from "../models/ClassSubject.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";
import Parent from "../models/Parent.js";
import ParentStudent from "../models/ParentStudent.js";
import SchoolClass from "../models/SchoolClass.js";

import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";
import { getCurrentAcademicContext } from "../utils/academicContext.js";

const DAY_ORDER = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

const daySort = (a, b) =>
  DAY_ORDER[a.dayOfWeek] - DAY_ORDER[b.dayOfWeek] ||
  a.startTime.localeCompare(b.startTime);

const populateEntries = (query) =>
  query
    .populate({
      path: "classSubject",
      populate: [
        { path: "subject", select: "name code" },
        { path: "schoolClass" },
      ],
    })
    .populate("schoolClass")
    .populate("session", "name")
    .populate("term", "name")
    .populate({
      path: "teacherAssignment",
      populate: {
        path: "teacher",
        populate: {
          path: "user",
          select: "firstName lastName otherName",
        },
      },
    });

// Resolve the current academic context, tolerating "not configured yet" so
// timetable reads come back empty instead of erroring the page.
const tryCurrentContext = async () => {
  try {
    return await getCurrentAcademicContext();
  } catch {
    return null;
  }
};

const createTimetableEntry = async (data) => {
  const assignment = await findDocumentOrFail(
    TeacherAssignment,
    data.teacherAssignment,
    "Teacher Assignment",
  );

  const classSubject = await ClassSubject.findOne({
    schoolClass: assignment.schoolClass,
    subject: assignment.subject,
  });

  if (!classSubject) {
    throw new ApiError(
      400,
      "This subject is not assigned to the selected class.",
    );
  }

  if (data.endTime <= data.startTime) {
    throw new ApiError(400, "End time must be after the start time.");
  }

  const clash = await Timetable.findOne({
    schoolClass: assignment.schoolClass,
    session: assignment.session,
    term: assignment.term,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
  });

  if (clash) {
    throw new ApiError(400, "This class already has a period in that time slot.");
  }

  const entry = await Timetable.create({
    schoolClass: assignment.schoolClass,
    classSubject: classSubject._id,
    teacherAssignment: assignment._id,
    teacher: assignment.teacher,
    session: assignment.session,
    term: assignment.term,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
  });

  return await populateEntries(Timetable.findById(entry._id));
};

const getMyTimetable = async (user) => {
  const filter = { isActive: true };

  if (user.role === "admin") {
    // Admins see everything (optionally narrowed by caller query later).
    const context = await tryCurrentContext();
    if (context) {
      filter.session = context.session._id;
      filter.term = context.term._id;
    }
  } else if (user.role === "teacher") {
    const teacher = await Teacher.findOne({ user: user._id });
    if (!teacher) throw new ApiError(404, "Teacher profile not found.");
    filter.teacher = teacher._id;

    const context = await tryCurrentContext();
    if (context) {
      filter.session = context.session._id;
      filter.term = context.term._id;
    }
  } else if (user.role === "student") {
    const context = await tryCurrentContext();
    if (!context) return [];

    const student = await Student.findOne({ user: user._id });
    if (!student) return [];

    const enrollment = await Enrollment.findOne({
      student: student._id,
      session: context.session._id,
      status: "Active",
    });
    if (!enrollment) return [];

    filter.schoolClass = enrollment.schoolClass;
    filter.session = context.session._id;
    filter.term = context.term._id;
  } else if (user.role === "parent") {
    const context = await tryCurrentContext();
    if (!context) return [];

    const parent = await Parent.findOne({ user: user._id });
    if (!parent) return [];

    const links = await ParentStudent.find({
      parent: parent._id,
      isActive: true,
    }).select("student");

    const enrollments = await Enrollment.find({
      student: { $in: links.map((link) => link.student) },
      session: context.session._id,
      status: "Active",
    }).select("schoolClass");

    if (enrollments.length === 0) return [];

    filter.schoolClass = {
      $in: enrollments.map((enrollment) => enrollment.schoolClass),
    };
    filter.session = context.session._id;
    filter.term = context.term._id;
  }

  const timetable = await populateEntries(Timetable.find(filter)).lean();
  return timetable.sort(daySort);
};

const getClassTimetable = async (schoolClassId, query, user) => {
  const schoolClass = await findDocumentOrFail(
    SchoolClass,
    schoolClassId,
    "Class",
  );

  const context = await tryCurrentContext();

  const filter = {
    schoolClass: schoolClass._id,
    isActive: true,
  };

  const sessionId = query.session || context?.session?._id;
  const termId = query.term || context?.term?._id;
  if (sessionId) filter.session = sessionId;
  if (termId) filter.term = termId;

  const timetable = await populateEntries(Timetable.find(filter)).lean();
  return timetable.sort(daySort);
};

const updateTimetableEntry = async (entryId, data) => {
  const entry = await findDocumentOrFail(Timetable, entryId, "Timetable entry");

  if (data.dayOfWeek !== undefined) entry.dayOfWeek = data.dayOfWeek;
  if (data.startTime !== undefined) entry.startTime = data.startTime;
  if (data.endTime !== undefined) entry.endTime = data.endTime;

  if (entry.endTime <= entry.startTime) {
    throw new ApiError(400, "End time must be after the start time.");
  }

  if (data.dayOfWeek !== undefined || data.startTime !== undefined) {
    const clash = await Timetable.findOne({
      schoolClass: entry.schoolClass,
      session: entry.session,
      term: entry.term,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      _id: { $ne: entry._id },
    });

    if (clash) {
      throw new ApiError(
        400,
        "This class already has a period in that time slot.",
      );
    }
  }

  await entry.save();

  return await populateEntries(Timetable.findById(entry._id));
};

const deleteTimetableEntry = async (entryId) => {
  const entry = await findDocumentOrFail(Timetable, entryId, "Timetable entry");
  await entry.deleteOne();
};

export default {
  createTimetableEntry,
  getMyTimetable,
  getClassTimetable,
  updateTimetableEntry,
  deleteTimetableEntry,
};
