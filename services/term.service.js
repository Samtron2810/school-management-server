import Session from "../models/Session.js";
import Term from "../models/Term.js";

import ApiError from "../utils/ApiError.js";

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
    await Term.updateMany(
      {
        session: currentSession._id,
      },
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

const getTerms = async () => {
  return await Term.find().populate("session", "name").sort({
    createdAt: -1,
  });
};

export default {
  createTerm,
  getTerms,
};
