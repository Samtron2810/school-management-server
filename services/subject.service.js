import Subject from "../models/Subject.js";
import ApiError from "../utils/ApiError.js";

const createSubject = async (data) => {
  const existingSubject = await Subject.findOne({
    $or: [
      {
        name: data.name,
      },
      {
        code: data.code.toUpperCase(),
      },
    ],
  });

  if (existingSubject) {
    throw new ApiError(400, "Subject already exists.");
  }

  return await Subject.create({
    ...data,
    code: data.code.toUpperCase(),
  });
};

const getSubjects = async () => {
  return await Subject.find().sort({
    name: 1,
  });
};

export default {
  createSubject,
  getSubjects,
};
