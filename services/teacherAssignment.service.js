import Teacher from "../models/Teacher.js";
import Subject from "../models/Subject.js";
import SchoolClass from "../models/SchoolClass.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import ClassSubject from "../models/ClassSubject.js";
import Assessment from "../models/Assessment.js";
import Attendance from "../models/Attendance.js";
import Enrollment from "../models/Enrollment.js";
import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";
import { getCurrentAcademicContext } from "../utils/academicContext.js";

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

const populateAssignment = (query) =>
  query
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
    .populate("term", "name");

const getTeacherAssignments = async () => {
  return await populateAssignment(TeacherAssignment.find()).sort({
    createdAt: -1,
  });
};

const getTeacherAssignment = async (assignmentId) => {
  const assignment = await populateAssignment(
    TeacherAssignment.findById(assignmentId),
  );

  if (!assignment) {
    throw new ApiError(404, "Teacher assignment not found.");
  }

  return assignment;
};

// Reassign a slot (swap teacher/class/subject) or toggle activation.
const updateTeacherAssignment = async (assignmentId, data) => {
  const assignment = await findDocumentOrFail(
    TeacherAssignment,
    assignmentId,
    "TeacherAssignment",
  );

  if (data.teacher) {
    const teacher = await Teacher.findById(data.teacher);
    if (!teacher) throw new ApiError(404, "Teacher not found.");
    assignment.teacher = teacher._id;
  }

  let nextSubject = assignment.subject;
  if (data.subject) {
    const subject = await Subject.findById(data.subject);
    if (!subject) throw new ApiError(404, "Subject not found.");
    nextSubject = subject._id;
  }

  let nextClass = assignment.schoolClass;
  if (data.schoolClass) {
    const schoolClass = await SchoolClass.findById(data.schoolClass);
    if (!schoolClass) throw new ApiError(404, "Class not found.");
    nextClass = schoolClass._id;
  }

  // The class/subject pairing must exist and the slot must be free.
  if (data.subject || data.schoolClass) {
    const classSubject = await ClassSubject.findOne({
      schoolClass: nextClass,
      subject: nextSubject,
    });
    if (!classSubject) {
      throw new ApiError(
        400,
        "This subject is not assigned to the selected class.",
      );
    }

    const conflict = await TeacherAssignment.findOne({
      subject: nextSubject,
      schoolClass: nextClass,
      session: assignment.session,
      term: assignment.term,
      _id: { $ne: assignment._id },
    });
    if (conflict) {
      throw new ApiError(
        400,
        "This subject has already been assigned to a teacher for this class this term.",
      );
    }

    assignment.subject = nextSubject;
    assignment.schoolClass = nextClass;
  }

  if (data.isActive !== undefined) assignment.isActive = data.isActive;

  await assignment.save();

  return await populateAssignment(TeacherAssignment.findById(assignment._id));
};

const deleteTeacherAssignment = async (assignmentId) => {
  const assignment = await findDocumentOrFail(
    TeacherAssignment,
    assignmentId,
    "TeacherAssignment",
  );

  const assessment = await Assessment.findOne({
    teacherAssignment: assignment._id,
  });
  if (assessment) {
    throw new ApiError(
      400,
      "This assignment has assessments and cannot be deleted.",
    );
  }

  const attendance = await Attendance.findOne({
    teacherAssignment: assignment._id,
  });
  if (attendance) {
    throw new ApiError(
      400,
      "This assignment has attendance records and cannot be deleted.",
    );
  }

  await assignment.deleteOne();
};

// Teacher-scoped: the signed-in teacher's own assignments.
const getMyTeacherAssignments = async (user) => {
  const teacher = await Teacher.findOne({ user: user._id });

  if (!teacher) {
    throw new ApiError(404, "Teacher profile not found.");
  }

  return await populateAssignment(
    TeacherAssignment.find({ teacher: teacher._id }),
  ).sort({ createdAt: -1 });
};

// Class roster for an assignment — the enrolled students of its class for
// the assignment's session. Admins can view any assignment's roster;
// teachers only their own.
const getAssignmentStudents = async (assignmentId, user) => {
  const assignment = await findDocumentOrFail(
    TeacherAssignment,
    assignmentId,
    "TeacherAssignment",
  );

  if (user.role === "teacher") {
    const teacher = await Teacher.findOne({ user: user._id });

    if (
      !teacher ||
      assignment.teacher.toString() !== teacher._id.toString()
    ) {
      throw new ApiError(403, "You are not assigned to this class subject.");
    }
  }

  const enrollments = await Enrollment.find({
    schoolClass: assignment.schoolClass,
    session: assignment.session,
    status: "Active",
  })
    .populate({
      path: "student",
      match: { isActive: true },
      populate: {
        path: "user",
        select: "firstName lastName otherName username email avatar",
      },
    })
    .populate("schoolClass");

  return enrollments.filter((enrollment) => enrollment.student);
};

export default {
  createTeacherAssignment,
  getTeacherAssignments,
  getTeacherAssignment,
  updateTeacherAssignment,
  deleteTeacherAssignment,
  getMyTeacherAssignments,
  getAssignmentStudents,
};
