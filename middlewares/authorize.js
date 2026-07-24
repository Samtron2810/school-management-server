import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const authorize = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        "You are not authorized to perform this action.",
      );
    }

    next();
  });
};

export default authorize;
