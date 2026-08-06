/**
 * Data Retention Service
 *
 * Policy (from Privacy Policy):
 *  - Soft-deleted users/accounts  → hard-purged after 30 days
 *  - Student academic records     → retained 7 years after last academic session
 *  - Access logs / token blacklist → rolled at 90 days (handled by MongoDB TTL index on AccessTokenBlacklist)
 *
 * Runs on a schedule via server.js; can also be triggered manually by an admin
 * via POST /api/v1/admin/retention/run (see routes/admin.routes.js).
 */

import User from "../models/User.js";
import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";
import Attendance from "../models/Attendance.js";
import Result from "../models/Result.js";
import ReportCardBatch from "../models/ReportCardBatch.js";
import Session from "../models/Session.js";
import logger from "../config/logger.js";

const DAYS_BEFORE_ACCOUNT_PURGE = 30;      // soft-deleted users
const YEARS_STUDENT_RECORD_RETENTION = 7;  // academic records after last session

/**
 * Purge user accounts that have been soft-deleted (isActive: false) for
 * more than DAYS_BEFORE_ACCOUNT_PURGE days.
 */
const purgeDeletedAccounts = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_BEFORE_ACCOUNT_PURGE);

  const staleUsers = await User.find({
    isActive: false,
    updatedAt: { $lt: cutoff },
  }).select("_id");

  if (!staleUsers.length) return { purgedAccounts: 0 };

  const userIds = staleUsers.map((u) => u._id);
  await User.deleteMany({ _id: { $in: userIds } });

  logger.info({
    type: "retention",
    event: "accounts_purged",
    count: userIds.length,
    cutoff,
  });

  return { purgedAccounts: userIds.length };
};

/**
 * Purge academic records for students whose last academic session ended more
 * than YEARS_STUDENT_RECORD_RETENTION years ago and whose User account is no
 * longer active.
 *
 * "Last academic session" = the most recent Session.endDate linked to any
 * Enrollment for that student.
 *
 * Purge cascade: Enrollment → Attendance → Result → ReportCardBatch rows
 * for those students. The Student profile and User are also removed.
 */
const purgeExpiredStudentRecords = async () => {
  const retentionCutoff = new Date();
  retentionCutoff.setFullYear(
    retentionCutoff.getFullYear() - YEARS_STUDENT_RECORD_RETENTION,
  );

  // Find sessions whose end date is beyond retention cutoff
  const expiredSessions = await Session.find({
    endDate: { $lt: retentionCutoff },
  }).select("_id");

  if (!expiredSessions.length) return { purgedStudentRecords: 0 };

  const expiredSessionIds = expiredSessions.map((s) => s._id);

  // Students enrolled only in expired sessions and with inactive accounts
  const enrollmentsInExpiredSessions = await Enrollment.distinct("student", {
    session: { $in: expiredSessionIds },
  });

  // Cross-check: student must have NO enrollment in a non-expired session
  const enrollmentsInActiveSessions = await Enrollment.distinct("student", {
    session: { $nin: expiredSessionIds },
  });

  const activeSet = new Set(
    enrollmentsInActiveSessions.map((id) => id.toString()),
  );

  const eligibleStudentIds = enrollmentsInExpiredSessions.filter(
    (id) => !activeSet.has(id.toString()),
  );

  if (!eligibleStudentIds.length) return { purgedStudentRecords: 0 };

  // Only purge students with inactive user accounts (extra safety check)
  const students = await Student.find({
    _id: { $in: eligibleStudentIds },
  })
    .populate("user", "isActive")
    .select("_id user");

  const toPurge = students
    .filter((s) => !s.user?.isActive)
    .map((s) => s._id);

  if (!toPurge.length) return { purgedStudentRecords: 0 };

  // Cascade delete
  await Promise.all([
    Enrollment.deleteMany({ student: { $in: toPurge } }),
    Attendance.deleteMany({ student: { $in: toPurge } }),
    Result.deleteMany({ student: { $in: toPurge } }),
    ReportCardBatch.updateMany(
      {},
      { $pull: { publishedStudents: { $in: toPurge } } },
    ),
  ]);

  // Remove student profiles
  const userIds = students.filter((s) => toPurge.includes(s._id)).map((s) => s.user?._id).filter(Boolean);
  await Student.deleteMany({ _id: { $in: toPurge } });
  if (userIds.length) await User.deleteMany({ _id: { $in: userIds } });

  logger.info({
    type: "retention",
    event: "student_records_purged",
    count: toPurge.length,
    retentionCutoff,
  });

  return { purgedStudentRecords: toPurge.length };
};

/**
 * Run all retention tasks and return a summary.
 */
export const runRetention = async () => {
  logger.info({ type: "retention", event: "retention_run_started" });

  const [accounts, records] = await Promise.allSettled([
    purgeDeletedAccounts(),
    purgeExpiredStudentRecords(),
  ]);

  const result = {
    purgedAccounts:
      accounts.status === "fulfilled" ? accounts.value.purgedAccounts : 0,
    purgedStudentRecords:
      records.status === "fulfilled" ? records.value.purgedStudentRecords : 0,
    errors: [
      accounts.status === "rejected" ? accounts.reason?.message : null,
      records.status === "rejected" ? records.reason?.message : null,
    ].filter(Boolean),
    ranAt: new Date(),
  };

  logger.info({ type: "retention", event: "retention_run_complete", ...result });
  return result;
};

export default { runRetention };
