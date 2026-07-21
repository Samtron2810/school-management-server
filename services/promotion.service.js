import mongoose from "mongoose";

import Enrollment from "../models/Enrollment.js";
import Student from "../models/Student.js";
import SchoolClass from "../models/SchoolClass.js";
import Session from "../models/Session.js";
import Term from "../models/Term.js";
import Promotion from "../models/Promotion.js";

import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";
import { getCurrentAcademicContext } from "../utils/academicContext.js";

const resolveId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && value._id) {
    return value._id;
  }

  return value;
};

const getCurrentSourceContext = async (data) => {
  if (data.sourceSession && data.sourceTerm) {
    return {
      session: await findDocumentOrFail(
        Session,
        resolveId(data.sourceSession),
        "Session",
      ),
      term: await findDocumentOrFail(
        Term,
        resolveId(data.sourceTerm),
        "Term",
      ),
    };
  }

  return await getCurrentAcademicContext();
};

const getSelectedStudents = async (sourceClassId, sourceSessionId, sourceTermId, studentIds) => {
  const filter = {
    schoolClass: sourceClassId,
    session: sourceSessionId,
    term: sourceTermId,
    status: "Active",
  };

  if (Array.isArray(studentIds) && studentIds.length > 0) {
    filter.student = {
      $in: studentIds,
    };
  }

  const enrollments = await Enrollment.find(filter)
    .populate({
      path: "student",
      populate: {
        path: "user",
        select: "firstName lastName otherName username admissionNumber",
      },
    })
    .populate("schoolClass")
    .sort({
      rollNumber: 1,
      createdAt: 1,
    });

  return enrollments;
};

const promoteStudents = async (data, user) => {
  if (user.role !== "admin") {
    throw new ApiError(403, "You are not authorized to promote students.");
  }

  const fromClassId = resolveId(data.fromClass);
  const toClassId = resolveId(data.toClass);
  const targetSessionId = resolveId(data.targetSession);
  const targetTermId = resolveId(data.targetTerm);

  if (!fromClassId || !toClassId || !targetSessionId || !targetTermId) {
    throw new ApiError(
      400,
      "fromClass, toClass, targetSession, and targetTerm are required.",
    );
  }

  if (fromClassId.toString() === toClassId.toString()) {
    throw new ApiError(400, "Source and target classes must be different.");
  }

  const sourceClass = await findDocumentOrFail(
    SchoolClass,
    fromClassId,
    "School Class",
  );

  const targetClass = await findDocumentOrFail(
    SchoolClass,
    toClassId,
    "School Class",
  );

  const sourceContext = await getCurrentSourceContext(data);
  const targetSession = await findDocumentOrFail(
    Session,
    targetSessionId,
    "Session",
  );
  const targetTerm = await findDocumentOrFail(Term, targetTermId, "Term");

  const selectedStudentIds = Array.isArray(data.studentIds)
    ? data.studentIds.map((studentId) => resolveId(studentId))
    : [];

  const enrollments = await getSelectedStudents(
    sourceClass._id,
    sourceContext.session._id,
    sourceContext.term._id,
    selectedStudentIds,
  );

  if (enrollments.length === 0) {
    throw new ApiError(404, "No eligible students found for promotion.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const promotionResults = [];
    let promotedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const enrollment of enrollments) {
      const studentId = resolveId(enrollment.student);

      const existingTargetEnrollment = await Enrollment.findOne({
        student: studentId,
        session: targetSession._id,
        term: targetTerm._id,
      }).session(session);

      if (existingTargetEnrollment) {
        skippedCount++;
        promotionResults.push({
          student: studentId,
          fromEnrollment: enrollment._id,
          toEnrollment: existingTargetEnrollment._id,
          status: "Skipped",
          reason: "Student is already enrolled for the target session and term.",
        });
        continue;
      }

      const nextEnrollment = await Enrollment.create(
        [
          {
            student: studentId,
            session: targetSession._id,
            term: targetTerm._id,
            schoolClass: targetClass._id,
            enrollmentNumber: enrollment.enrollmentNumber,
            rollNumber: enrollment.rollNumber,
            status: "Active",
            enrolledAt: new Date(),
          },
        ],
        {
          session,
        },
      );

      enrollment.status = "Transferred";
      await enrollment.save({ session });

      promotedCount++;
      promotionResults.push({
        student: studentId,
        fromEnrollment: enrollment._id,
        toEnrollment: nextEnrollment[0]._id,
        status: "Promoted",
        reason: "Student promoted successfully.",
      });
    }

    const promotion = await Promotion.create(
      [
        {
          sourceSession: sourceContext.session._id,
          sourceTerm: sourceContext.term._id,
          targetSession: targetSession._id,
          targetTerm: targetTerm._id,
          fromClass: sourceClass._id,
          toClass: targetClass._id,
          promotedBy: user._id,
          title: data.title || "Student Promotion",
          notes: data.notes || "",
          totalStudents: enrollments.length,
          promotedCount,
          skippedCount,
          failedCount,
          status:
            failedCount > 0
              ? "Partial"
              : skippedCount > 0
                ? "Partial"
                : "Completed",
          promotedAt: data.promotedAt ? new Date(data.promotedAt) : new Date(),
          results: promotionResults,
        },
      ],
      {
        session,
      },
    );

    await session.commitTransaction();

    return promotion[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getPromotions = async () => {
  return await Promotion.find({
    isActive: true,
  })
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
    .populate({
      path: "results.student",
      populate: {
        path: "user",
        select: "firstName lastName otherName username admissionNumber",
      },
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
  getPromotions,
  getPromotionById,
};
