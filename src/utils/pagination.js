const { config } = require("../config");

function parsePageParams(query) {
  const rawPage = Number(query.page);
  const page = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1);
  const rawSize = Number(query.pageSize);
  const requested = Number.isFinite(rawSize) ? rawSize : config.pagination.defaultPageSize;
  const pageSize = Math.min(config.pagination.maxPageSize, Math.max(1, requested));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

function buildPaginatedResponse(items, page, total, pageSize) {
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

function paginate(items, page, pageSize) {
  const offset = (page - 1) * pageSize;
  return items.slice(offset, offset + pageSize);
}

module.exports = { parsePageParams, buildPaginatedResponse, paginate };
