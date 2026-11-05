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
