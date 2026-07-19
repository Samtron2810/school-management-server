import mongoose from "mongoose";

import ApiError from "./ApiError.js";

const findDocumentOrFail = async (Model, id, modelName, options = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${modelName} ID.`);
  }

  let query = Model.findById(id);

  if (options.select) {
    query = query.select(options.select);
  }

  if (options.populate) {
    query = query.populate(options.populate);
  }

  if (options.session) {
    query = query.session(options.session);
  }

  const document = await query;

  if (!document) {
    throw new ApiError(404, `${modelName} not found.`);
  }

  return document;
};

export default findDocumentOrFail;
