const searchFilter = (search, fields = []) => {
  if (!search) return {};

  return {
    $or: fields.map((field) => ({
      [field]: {
        $regex: search,
        $options: "i",
      },
    })),
  };
};

export default searchFilter;
