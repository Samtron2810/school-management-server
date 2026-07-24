import Session from "../models/Session.js";
import ApiError from "../utils/ApiError.js";

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

export default {
  createSession,
  getSessions,
};
