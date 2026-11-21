export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

export interface Page<T> extends Pagination {
  total: number;
  data: T[];
}

interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return value !== null && Number.isInteger(parsed) && parsed > 0
    ? parsed
    : fallback;
}

export function parsePagination(
  params: URLSearchParams,
  options: PaginationOptions = {},
): Pagination {
  const limit = Math.min(
    positiveInt(params.get("limit"), options.defaultLimit ?? 20),
    options.maxLimit ?? 100,
  );
  const page = positiveInt(params.get("page"), 1);
  return { page, limit, offset: (page - 1) * limit };
}

export function paginate<T>(
  items: readonly T[],
  params: URLSearchParams,
  options?: PaginationOptions,
): Page<T> {
  const { page, limit, offset } = parsePagination(params, options);
  return {
    page,
    limit,
    offset,
    total: items.length,
    data: items.slice(offset, offset + limit),
  };
}
