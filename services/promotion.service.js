import Enrollment from "../models/Enrollment.js";
import SchoolClass from "../models/SchoolClass.js";
import Session from "../models/Session.js";
import Term from "../models/Term.js";
import Promotion from "../models/Promotion.js";

import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";
import withTransaction from "../utils/withTransaction.js";
import { getClassRoster } from "../utils/classRoster.js";
import { getCurrentAcademicContext } from "../utils/academicContext.js";
import { bustDashboardCache } from "./dashboard.service.js";

const resolveId = (value) => {
  if (!value) return null;
  if (typeof value === "object" && value._id) return value._id;
  return value;
};

const toIdSet = (list) =>
  new Set(
    (Array.isArray(list) ? list : []).map((id) => String(resolveId(id))),
  );

// The session/term students are promoted FROM: explicit if given, else the
// current one. Always returned as documents.
const getSourceContext = async (data) => {
  if (data.sourceSession && data.sourceTerm) {
    return {
      session: await findDocumentOrFail(
        Session,
        resolveId(data.sourceSession),
        "Session",
      ),
      term: await findDocumentOrFail(Term, resolveId(data.sourceTerm), "Term"),
    };
  }

  const context = await getCurrentAcademicContext();
  return {
    session: await findDocumentOrFail(Session, context.session._id, "Session"),
    term: await findDocumentOrFail(Term, context.term._id, "Term"),
  };
};

// Who is promoted? Students with an Active enrollment in the class for the
// source SESSION — in any term. (Enrollments are per term and are usually
// created once, so requiring a row for the exact current term finds no one.)
// A class that was already promoted has no Active rows left, which is what
// stops a second run from doing it twice.
const getEligibleRoster = (classId, sessionId, populate = null) =>
  getClassRoster(classId, sessionId, { statuses: ["Active"], populate });

// POST /promotions
// body: {
//   fromClass, targetSession, targetTerm,
//   toClass            — required unless graduate is true
//   graduate?: bool    — final class: students are marked Graduated
//   studentIds?: []    — limit to these students (default: whole class)
//   repeatStudentIds?: [] — these students stay in fromClass next session
//   title?, notes?, promotedAt?, sourceSession?, sourceTerm?
// }
const promoteStudents = async (data, user) => {
  if (user.role !== "admin") {
    throw new ApiError(403, "You are not authorized to promote students.");
  }

  const graduate = data.graduate === true;
  const fromClassId = resolveId(data.fromClass);
  const toClassId = resolveId(data.toClass);
  const targetSessionId = resolveId(data.targetSession);
  const targetTermId = resolveId(data.targetTerm);

  if (!fromClassId || !targetSessionId || !targetTermId) {
    throw new ApiError(
      400,
      "fromClass, targetSession, and targetTerm are required.",
    );
  }

  if (!graduate && !toClassId) {
    throw new ApiError(400, "toClass is required unless the class is graduating.");
  }

  if (!graduate && String(fromClassId) === String(toClassId)) {
    throw new ApiError(400, "Source and target classes must be different.");
  }

  const sourceClass = await findDocumentOrFail(
    SchoolClass,
    fromClassId,
    "School Class",
  );
  const targetClass = graduate
    ? null
    : await findDocumentOrFail(SchoolClass, toClassId, "School Class");

  const source = await getSourceContext(data);
  const targetSession = await findDocumentOrFail(
    Session,
    targetSessionId,
    "Session",
  );
  const targetTerm = await findDocumentOrFail(Term, targetTermId, "Term");

  if (String(targetSession._id) === String(source.session._id)) {
    throw new ApiError(
      400,
      "The target session must be a different session. To move a student within a session, edit their enrollment.",
    );
  }

  if (String(targetTerm.session) !== String(targetSession._id)) {
    throw new ApiError(400, "The target term does not belong to the target session.");
  }

  if (
    targetSession.startDate &&
    source.session.startDate &&
    targetSession.startDate <= source.session.startDate
  ) {
    throw new ApiError(400, "The target session must come after the source session.");
  }

  const selected = toIdSet(data.studentIds);
  const repeaters = toIdSet(data.repeatStudentIds);

  const result = await withTransaction(async (txn) => {
    // Read inside the transaction so a concurrent edit to these enrollments
    // causes a write conflict instead of being silently overwritten.
    let roster = await getClassRoster(sourceClass._id, source.session._id, {
      statuses: ["Active"],
      session: txn,
    });
    if (selected.size > 0) {
      roster = roster.filter((row) => selected.has(String(row.student)));
    }

    if (roster.length === 0) {
      throw new ApiError(
        404,
        "No active students found in this class for the source session. If it was already promoted, there is nothing left to do.",
      );
    }

    const studentIds = roster.map((row) => row.student);

    const existingTarget = await Enrollment.find({
      student: { $in: studentIds },
      session: targetSession._id,
      term: targetTerm._id,
    })
      .select("student")
      .session(txn);
    const alreadyEnrolled = new Map(
      existingTarget.map((e) => [String(e.student), e._id]),
    );

    // Roll numbers continue after whatever the target class already has.
    const rollCursor = new Map();
    const nextRoll = async (classId) => {
      const key = String(classId);
      if (!rollCursor.has(key)) {
        const last = await Enrollment.findOne({
          schoolClass: classId,
          session: targetSession._id,
        })
          .sort({ rollNumber: -1 })
          .select("rollNumber")
          .session(txn);
        rollCursor.set(key, last?.rollNumber || 0);
      }
      const next = rollCursor.get(key) + 1;
      rollCursor.set(key, next);
      return next;
    };

    const results = [];
    const newDocs = [];
    const newMeta = [];
    const graduatedIds = [];

    for (const row of roster) {
      const key = String(row.student);
      const repeat = repeaters.has(key);

      if (graduate && !repeat) {
        graduatedIds.push(row.student);
        results.push({
          student: row.student,
          fromEnrollment: row._id,
          toEnrollment: null,
          status: "Graduated",
          reason: "Marked as graduated.",
        });
        continue;
      }

      if (alreadyEnrolled.has(key)) {
        results.push({
          student: row.student,
          fromEnrollment: row._id,
          toEnrollment: alreadyEnrolled.get(key),
          status: "Skipped",
          reason: "Student is already enrolled for the target session and term.",
        });
        continue;
      }

      const classId = repeat ? sourceClass._id : targetClass._id;
      newDocs.push({
        student: row.student,
        session: targetSession._id,
        term: targetTerm._id,
        schoolClass: classId,
        enrollmentNumber: row.enrollmentNumber,
        rollNumber: await nextRoll(classId),
        status: "Active",
        enrolledAt: new Date(),
      });
      newMeta.push({ row, repeat });
    }

    const created = newDocs.length
      ? await Enrollment.insertMany(newDocs, { session: txn })
      : [];

    created.forEach((enrollment, index) => {
      const { row, repeat } = newMeta[index];
      results.push({
        student: row.student,
        fromEnrollment: row._id,
        toEnrollment: enrollment._id,
        status: repeat ? "Repeated" : "Promoted",
        reason: repeat
          ? "Student will repeat the class."
          : "Student promoted successfully.",
      });
    });

    // Close the old enrollments (every term row of the student in this class
    // and session) in one query per outcome.
    const closeOld = (ids, status) =>
      ids.length
        ? Enrollment.updateMany(
            {
              student: { $in: ids },
              schoolClass: sourceClass._id,
              session: source.session._id,
              status: "Active",
            },
            { $set: { status } },
            { session: txn },
          )
        : null;

    await closeOld(graduatedIds, "Graduated");
    await closeOld(
      newMeta.map(({ row }) => row.student),
      "Transferred",
    );

    const count = (status) => results.filter((r) => r.status === status).length;
    const skippedCount = count("Skipped");

    const [promotion] = await Promotion.create(
      [
        {
          sourceSession: source.session._id,
          sourceTerm: source.term._id,
          targetSession: targetSession._id,
          targetTerm: targetTerm._id,
          fromClass: sourceClass._id,
          toClass: targetClass ? targetClass._id : null,
          isGraduation: graduate,
          promotedBy: user._id,
          title: data.title || "Student Promotion",
          notes: data.notes || "",
          totalStudents: roster.length,
          promotedCount: count("Promoted"),
          repeatedCount: count("Repeated"),
          graduatedCount: count("Graduated"),
          skippedCount,
          failedCount: 0,
          status: skippedCount > 0 ? "Partial" : "Completed",
          promotedAt: data.promotedAt ? new Date(data.promotedAt) : new Date(),
          results,
        },
      ],
      { session: txn },
    );

    return promotion;
  });

  await bustDashboardCache();
  return result;
};

// GET /promotions/roster?fromClass=&session?
// The students a promotion run would act on, so the admin can mark repeaters.
const getPromotionRoster = async (query, user) => {
  if (user.role !== "admin") {
    throw new ApiError(403, "You are not authorized to view this.");
  }
  if (!query.fromClass) {
    throw new ApiError(400, "fromClass is required.");
  }

  const schoolClass = await findDocumentOrFail(
    SchoolClass,
    query.fromClass,
    "School Class",
  );

  const session = query.session
    ? await findDocumentOrFail(Session, query.session, "Session")
    : await findDocumentOrFail(
        Session,
        (await getCurrentAcademicContext()).session._id,
        "Session",
      );

  const roster = await getEligibleRoster(schoolClass._id, session._id, {
    path: "student",
    populate: {
      path: "user",
      select: "firstName lastName otherName",
    },
  });

  return {
    session: { _id: session._id, name: session.name },
    students: roster
      .filter((row) => row.student)
      .map((row) => ({
        student: row.student,
        rollNumber: row.rollNumber ?? null,
      })),
  };
};

// The list view only needs the counts; per-student results (which can run
// to hundreds of rows per promotion) are fetched by id.
const getPromotions = async () => {
  return await Promotion.find({
    isActive: true,
  })
    .select("-results")
    .populate("sourceSession", "name")
    .populate("sourceTerm", "name")
    .populate("targetSession", "name")
    .populate("targetTerm", "name")
    .populate("fromClass")
    .populate("toClass")
    .populate({
      path: "promotedBy",
      select: "firstName lastName username role",
    })
    .sort({
      createdAt: -1,
    });
};

const getPromotionById = async (promotionId) => {
  return await findDocumentOrFail(Promotion, promotionId, "Promotion", {
    populate: [
      {
        path: "sourceSession",
        select: "name",
      },
      {
        path: "sourceTerm",
        select: "name",
      },
      {
        path: "targetSession",
        select: "name",
      },
      {
        path: "targetTerm",
        select: "name",
      },
      {
        path: "fromClass",
      },
      {
        path: "toClass",
      },
      {
        path: "promotedBy",
        select: "firstName lastName username role",
      },
      {
        path: "results.student",
        populate: {
          path: "user",
          select: "firstName lastName otherName username admissionNumber",
        },
      },
    ],
  });
};

export default {
  promoteStudents,
  getPromotionRoster,
  getPromotions,
  getPromotionById,
};
