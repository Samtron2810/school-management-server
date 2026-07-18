import Session from "../models/Session.js";
import Term from "../models/Term.js";

import ApiError from "./ApiError.js";

export const getCurrentSession = async () => {
  const session = await Session.findOne({
    isCurrent: true,
  });

  if (!session) {
    throw new ApiError(400, "No active academic session found.");
  }

  return session;
};

export const getCurrentTerm = async (sessionId) => {
  const term = await Term.findOne({
    session: sessionId,
    isCurrent: true,
  });

  if (!term) {
    throw new ApiError(400, "No active academic term found.");
  }

  return term;
};

export const getCurrentAcademicContext = async () => {
  const session = await getCurrentSession();

  const term = await getCurrentTerm(session._id);

  return {
    session,
    term,
  };
};
