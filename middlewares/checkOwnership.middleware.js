import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";

const checkOwnership = (Model, ownerField = "createdBy", paramName = "id") =>
  asyncHandler(async (req, res, next) => {
    if (req.user?.role === "admin") {
      return next();
    }

    const resource = await findDocumentOrFail(
      Model,
      req.params[paramName],
      Model.modelName,
    );

    const owner = resource?.[ownerField];

    if (!owner) {
      throw new ApiError(403, "You are not authorized to access this resource.");
    }

    const ownerId = owner._id ? owner._id.toString() : owner.toString();

    if (ownerId !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to access this resource.");
    }

    req.resource = resource;

    next();
  });

export default checkOwnership;
