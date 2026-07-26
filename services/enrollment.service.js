import Enrollment from "../models/Enrollment.js";
import Student from "../models/Student.js";
import Session from "../models/Session.js";
import Term from "../models/Term.js";
import SchoolClass from "../models/SchoolClass.js";
import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";
import withTransaction from "../utils/withTransaction.js";

const createEnrollment = async (data) => {
  const student = await Student.findById(data.student);
  if (!student) {
    throw new ApiError(404, "Student not found.");
  }

  const currentSession = await Session.findOne({
    isCurrent: true,
  });
  if (!currentSession) {
    throw new ApiError(400, "No active session found.");
  }

  const currentTerm = await Term.findOne({
    session: currentSession._id,
    isCurrent: true,
  });
  if (!currentTerm) {
    throw new ApiError(400, "No active term found.");
  }

  const schoolClass = await SchoolClass.findById(data.schoolClass);
  if (!schoolClass) {
    throw new ApiError(404, "Class not found.");
  }

  const existingEnrollment = await Enrollment.findOne({
    student: student._id,
    session: currentSession._id,
    term: currentTerm._id,
  });

  if (existingEnrollment) {
    throw new ApiError(
      400,
      "Student is already enrolled for the current term.",
    );
  }

  return await Enrollment.create({
    student: student._id,
    session: currentSession._id,
    term: currentTerm._id,
    schoolClass: schoolClass._id,
    rollNumber: data.rollNumber,
    enrollmentNumber: data.enrollmentNumber,
  });
};

// Enroll many students into one class at once. All-or-nothing: if any
// student fails (not found, already enrolled, etc.) the whole batch aborts.
const bulkCreateEnrollments = async (data) => {
  const studentIds = Array.isArray(data.students) ? data.students : [];

  if (studentIds.length === 0) {
    throw new ApiError(400, "At least one student is required.");
  }

  return await withTransaction(async (session) => {
    const schoolClass = await SchoolClass.findById(data.schoolClass).session(
      session,
    );
    if (!schoolClass) {
      throw new ApiError(404, "Class not found.");
    }

    const currentSession = await Session.findOne({ isCurrent: true }).session(
      session,
    );
    if (!currentSession) {
      throw new ApiError(400, "No active session found.");
    }

    const currentTerm = await Term.findOne({
      session: currentSession._id,
      isCurrent: true,
    }).session(session);
    if (!currentTerm) {
      throw new ApiError(400, "No active term found.");
    }

    const created = [];

    for (const studentId of studentIds) {
      const student = await Student.findById(studentId).session(session);
      if (!student) {
        throw new ApiError(404, `Student not found: ${studentId}`);
      }

      const existingEnrollment = await Enrollment.findOne({
        student: student._id,
        session: currentSession._id,
        term: currentTerm._id,
      }).session(session);

      if (existingEnrollment) {
        throw new ApiError(
          400,
          `${student.admissionNumber || student._id} is already enrolled for the current term.`,
        );
      }

      const [enrollment] = await Enrollment.create(
        [
          {
            student: student._id,
            session: currentSession._id,
            term: currentTerm._id,
            schoolClass: schoolClass._id,
          },
        ],
        { session },
      );

      created.push(enrollment);
    }

    return created;
  });
};

const populateEnrollment = (query) =>
  query
    .populate({
      path: "student",
      populate: {
        path: "user",
        select: "firstName lastName otherName",
      },
    })
    .populate("schoolClass")
    .populate("session", "name")
    .populate("term", "name");

const getEnrollments = async () => {
  return await populateEnrollment(Enrollment.find()).sort({
    createdAt: -1,
  });
};

const getEnrollment = async (enrollmentId) => {
  const enrollment = await populateEnrollment(
    Enrollment.findById(enrollmentId),
  );

  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found.");
  }

  return enrollment;
};

// Move a student to another class, or adjust status/roll details.
const updateEnrollment = async (enrollmentId, data) => {
  const enrollment = await findDocumentOrFail(
    Enrollment,
    enrollmentId,
    "Enrollment",
  );

  if (data.schoolClass) {
    const schoolClass = await SchoolClass.findById(data.schoolClass);
    if (!schoolClass) {
      throw new ApiError(404, "Class not found.");
    }
    enrollment.schoolClass = schoolClass._id;
  }

  for (const field of ["status", "rollNumber", "enrollmentNumber"]) {
    if (data[field] !== undefined) enrollment[field] = data[field];
  }

  await enrollment.save();

  return await populateEnrollment(Enrollment.findById(enrollment._id));
};

const deleteEnrollment = async (enrollmentId) => {
  const enrollment = await findDocumentOrFail(
    Enrollment,
    enrollmentId,
    "Enrollment",
  );

  await enrollment.deleteOne();
};

export default {
  createEnrollment,
  bulkCreateEnrollments,
  getEnrollments,
  getEnrollment,
  updateEnrollment,
  deleteEnrollment,
};
