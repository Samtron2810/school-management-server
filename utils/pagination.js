const paginate = async (Model, filter = {}, options = {}) => {
  const page = Number(options.page) || 1;

  const limit = Number(options.limit) || 20;

  const skip = (page - 1) * limit;

  let query = Model.find(filter);

  if (options.select) {
    query = query.select(options.select);
  }

  if (options.populate) {
    query = query.populate(options.populate);
  }

  if (options.sort) {
    query = query.sort(options.sort);
  } else {
    query = query.sort({
      createdAt: -1,
    });
  }

  query = query.skip(skip).limit(limit);

  const data = await query;

  const total = await Model.countDocuments(filter);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

export default paginate;
