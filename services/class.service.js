import SchoolClass from "../models/SchoolClass.js";
import ApiError from "../utils/ApiError.js";

const createClass = async (data) => {
  const existingClass = await SchoolClass.findOne({
    name: data.name,
    arm: data.arm,
  });

  if (existingClass) {
    throw new ApiError(400, "Class already exists.");
  }

  return await SchoolClass.create(data);
};

const getClasses = async () => {
  return await SchoolClass.find().sort({
    name: 1,
    arm: 1,
  });
};

export default {
  createClass,
  getClasses,
};
