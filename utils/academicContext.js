import Session from "../models/Session.js";
import Term from "../models/Term.js";
import ApiError from "./ApiError.js";
import { cacheGet, cacheSet, cacheDel } from "../config/redis.js";

const CACHE_KEY = "academic:context";
const CACHE_TTL = 120; // 2 minutes

export const invalidateAcademicContextCache = async () => {
  await cacheDel(CACHE_KEY);
};

export const getCurrentSession = async () => {
  const session = await Session.findOne({ isCurrent: true });
  if (!session) throw new ApiError(400, "No active academic session found.");
  return session;
};

export const getCurrentTerm = async (sessionId) => {
  const term = await Term.findOne({ session: sessionId, isCurrent: true });
  if (!term) throw new ApiError(400, "No active academic term found.");
  return term;
};

export const getCurrentAcademicContext = async () => {
  // Try Redis first
  const cached = await cacheGet(CACHE_KEY);
  if (cached) return cached;

  const session = await getCurrentSession();
  const term = await getCurrentTerm(session._id);

  const context = {
    session: session.toObject(),
    term: term.toObject(),
  };

  await cacheSet(CACHE_KEY, context, CACHE_TTL);

  return context;
};
