import Session from "../models/Session.js";
import Term from "../models/Term.js";

import ApiError from "./ApiError.js";

// Cache the active session/term for 30 s. These change at most a few times
// per year (term transitions) but are queried on almost every API request —
// 2 DB round-trips × 39 call-sites = ~78 extra queries per concurrent user.
// When a session or term is activated/switched, call invalidateAcademicContextCache()
// to bust this immediately so teachers don't get stale context mid-term.
let _contextCache = null;
let _contextCacheAt = 0;
const CONTEXT_TTL_MS = 30_000; // 30 seconds

export const invalidateAcademicContextCache = () => {
  _contextCache = null;
  _contextCacheAt = 0;
};

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
  const now = Date.now();
  if (_contextCache && now - _contextCacheAt < CONTEXT_TTL_MS) {
    return _contextCache;
  }

  const session = await getCurrentSession();
  const term = await getCurrentTerm(session._id);

  _contextCache = { session, term };
  _contextCacheAt = now;

  return _contextCache;
};
