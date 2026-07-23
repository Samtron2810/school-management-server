import Session from "../models/Session.js";
import Term from "../models/Term.js";
import Enrollment from "../models/Enrollment.js";

import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";

const createSession = async (data) => {
  const existingSession = await Session.findOne({
    name: data.name,
  });

  if (existingSession) {
    throw new ApiError(400, "Session already exists.");
  }

  if (data.isCurrent) {
    await Session.updateMany(
      {},
      {
        isCurrent: false,
      },
    );
  }

  const session = await Session.create(data);

  return session;
};

const getSessions = async () => {
  return await Session.find().sort({
    createdAt: -1,
  });
};

const getSession = async (sessionId) => {
  return await findDocumentOrFail(Session, sessionId, "Session");
};

const updateSession = async (sessionId, data) => {
  const session = await findDocumentOrFail(Session, sessionId, "Session");

  if (data.name && data.name !== session.name) {
    const conflict = await Session.findOne({
      name: data.name,
      _id: { $ne: session._id },
    });

    if (conflict) {
      throw new ApiError(400, "A session with this name already exists.");
    }
  }

  // Only one session may be current at a time.
  if (data.isCurrent === true) {
    await Session.updateMany(
      { _id: { $ne: session._id } },
      { isCurrent: false },
    );
  }

  for (const field of ["name", "startDate", "endDate", "isCurrent"]) {
    if (data[field] !== undefined) session[field] = data[field];
  }

  await session.save();

  return session;
};

const deleteSession = async (sessionId) => {
  const session = await findDocumentOrFail(Session, sessionId, "Session");

  if (session.isCurrent) {
    throw new ApiError(400, "The current session cannot be deleted.");
  }

  const term = await Term.findOne({ session: session._id });
  if (term) {
    throw new ApiError(
      400,
      "This session has terms and cannot be deleted. Delete its terms first.",
    );
  }

  const enrollment = await Enrollment.findOne({ session: session._id });
  if (enrollment) {
    throw new ApiError(
      400,
      "This session has enrollments and cannot be deleted.",
    );
  }

  await session.deleteOne();
};

export default {
  createSession,
  getSessions,
  getSession,
  updateSession,
  deleteSession,
};
