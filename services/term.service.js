import Session from "../models/Session.js";
import Term from "../models/Term.js";
import Enrollment from "../models/Enrollment.js";

import ApiError from "../utils/ApiError.js";
import { invalidateAcademicContextCache } from "../utils/academicContext.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";

const createTerm = async (data) => {
  const currentSession = await Session.findOne({
    isCurrent: true,
  });

  if (!currentSession) {
    throw new ApiError(400, "No active academic session found.");
  }

  const existingTerm = await Term.findOne({
    session: currentSession._id,
    name: data.name,
  });

  if (existingTerm) {
    throw new ApiError(400, "This term already exists in the current session.");
  }

  if (data.isCurrent) {
    // Global, not session-scoped: only one term may be current at a time,
    // system-wide — otherwise a term left over from another session can
    // coexist as "current" alongside this one.
    await Term.updateMany(
      {},
      {
        isCurrent: false,
      },
    );
  }

  return await Term.create({
    ...data,
    session: currentSession._id,
  });
};

// No filters: all terms. `activeOnly`: only terms under the active session.
// `session`: only terms under that specific session id.
const getTerms = async (query = {}) => {
  const filter = {};

  if (query.session) {
    filter.session = query.session;
  } else if (query.activeOnly) {
    const currentSession = await Session.findOne({ isCurrent: true });
    filter.session = currentSession ? currentSession._id : null;
  }

  return await Term.find(filter).populate("session", "name").sort({
    createdAt: -1,
  });
};

const getTerm = async (termId) => {
  return await findDocumentOrFail(Term, termId, "Term", {
    populate: { path: "session", select: "name" },
  });
};

const updateTerm = async (termId, data) => {
  const term = await findDocumentOrFail(Term, termId, "Term");

  if (data.name && data.name !== term.name) {
    const conflict = await Term.findOne({
      session: term.session,
      name: data.name,
      _id: { $ne: term._id },
    });

    if (conflict) {
      throw new ApiError(400, "This term already exists in the session.");
    }
  }

  // Only one term may be current at a time, system-wide.
  if (data.isCurrent === true) {
    const session = await Session.findById(term.session);

    if (!session || !session.isCurrent) {
      throw new ApiError(
        400,
        "Cannot activate this term because its session is not the active session. Activate the session first.",
      );
    }

    await Term.updateMany(
      { _id: { $ne: term._id } },
      { isCurrent: false },
    );
  }

  // The parent session stays immutable — move a term by recreating it.
  for (const field of ["name", "startDate", "endDate", "isCurrent"]) {
    if (data[field] !== undefined) term[field] = data[field];
  }

  await term.save();

  // Bust the academic context cache whenever isCurrent changes on a term.
  if (data.isCurrent !== undefined) {
    invalidateAcademicContextCache();
  }

  return await Term.findById(term._id).populate("session", "name");
};

const deleteTerm = async (termId) => {
  const term = await findDocumentOrFail(Term, termId, "Term");

  if (term.isCurrent) {
    throw new ApiError(400, "The current term cannot be deleted.");
  }

  const enrollment = await Enrollment.findOne({ term: term._id });
  if (enrollment) {
    throw new ApiError(400, "This term has enrollments and cannot be deleted.");
  }

  await term.deleteOne();
};

export default {
  createTerm,
  getTerms,
  getTerm,
  updateTerm,
  deleteTerm,
};
