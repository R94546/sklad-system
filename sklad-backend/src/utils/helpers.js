export const paginate = (page = 1, limit = 20) => {
  const take = parseInt(limit);
  const skip = (parseInt(page) - 1) * take;
  return { take, skip };
};

export const paginateResult = (data, total, page, limit) => {
  return {
    data,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
  };
};
