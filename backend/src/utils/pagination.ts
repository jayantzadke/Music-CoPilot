const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export function parsePagination(raw: { page?: unknown; limit?: unknown }): PaginationParams {
  const page = Math.max(1, Number(raw.page) || DEFAULT_PAGE)
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(raw.limit) || DEFAULT_LIMIT))
  return { page, limit, offset: (page - 1) * limit }
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams,
) {
  return {
    data,
    total,
    page: params.page,
    limit: params.limit,
    hasMore: params.offset + data.length < total,
  }
}
