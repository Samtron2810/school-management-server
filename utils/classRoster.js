import Enrollment from "../models/Enrollment.js";

// Statuses that keep a student on a class list for a session. "Transferred"
// and "Graduated" stay so a class's scores and report cards remain reachable
// after the students have been promoted out of it.
export const ROSTER_STATUSES = ["Active", "Transferred", "Graduated"];

// Enrollments are stored per student/session/term, so one student can have
// up to three rows in the same class and session. Class lists are
// session-level: this collapses them to ONE enrollment per student.
export const getClassRoster = async (
  schoolClassId,
  sessionId,
  { populate = null, statuses = ROSTER_STATUSES, session = null } = {},
) => {
  let query = Enrollment.find({
    schoolClass: schoolClassId,
    session: sessionId,
    status: { $in: statuses },
  }).sort({ rollNumber: 1, createdAt: 1 });

  if (populate) query = query.populate(populate);
  if (session) query = query.session(session);

  const rows = await query;
  const byStudent = new Map();

  for (const row of rows) {
    const key = String(row.student?._id ?? row.student);
    if (!byStudent.has(key)) byStudent.set(key, row);
  }

  return [...byStudent.values()];
};

// A student's enrollment for a session. Enrollments are created once (for
// the term the student was admitted in) and are NOT copied forward when a
// new term starts, so asking for "the current term's row" finds nobody in
// Term 2 / Term 3. This prefers the exact term when it exists and otherwise
// falls back to the student's latest row in the session.
export const findStudentEnrollment = async (
  studentId,
  sessionId,
  termId = null,
  { statuses = ["Active"], populate = null } = {},
) => {
  let query = Enrollment.find({
    student: studentId,
    session: sessionId,
    status: { $in: statuses },
  }).sort({ createdAt: -1 });

  if (populate) query = query.populate(populate);

  const rows = await query;
  if (rows.length === 0) return null;

  return (
    (termId && rows.find((row) => String(row.term) === String(termId))) ||
    rows[0]
  );
};
