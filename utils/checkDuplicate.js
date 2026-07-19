import ApiError from "./ApiError.js";

const checkDuplicate = async (Model, filter, message, options = {}) => {
  let query = Model.findOne(filter);

  if (options.session) {
    query = query.session(options.session);
  }

  const document = await query;

  if (document) {
    throw new ApiError(400, message);
  }

  return false;
};

export default checkDuplicate;
