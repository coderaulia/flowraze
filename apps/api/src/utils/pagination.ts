import type { Request } from 'express';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

type QueryValue = Request['query'][string];

export interface Pagination {
  isPaginated: boolean;
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

function getFirstQueryValue(value: QueryValue): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first : undefined;
  }

  return typeof value === 'string' ? value : undefined;
}

function parsePositiveInteger(value: QueryValue, fallback: number): number {
  const rawValue = getFirstQueryValue(value);
  if (!rawValue) return fallback;

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getPagination(query: Request['query']): Pagination {
  const isPaginated = query.page !== undefined || query.limit !== undefined;
  const page = parsePositiveInteger(query.page, DEFAULT_PAGE);
  const requestedLimit = parsePositiveInteger(query.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);

  return {
    isPaginated,
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function getPaginationArgs(
  pagination: Pagination
): { skip?: number; take?: number } {
  if (!pagination.isPaginated) {
    return {};
  }

  return {
    skip: pagination.skip,
    take: pagination.limit,
  };
}

export function getPaginationMeta(
  pagination: Pagination,
  total: number
): PaginationMeta {
  return {
    page: pagination.page,
    limit: pagination.limit,
    total,
  };
}

export function paginatedResponse<T>(
  data: T[],
  pagination: Pagination,
  total: number
) {
  return {
    success: true,
    data,
    ...(pagination.isPaginated
      ? { pagination: getPaginationMeta(pagination, total) }
      : {}),
  };
}
