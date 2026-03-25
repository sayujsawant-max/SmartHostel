import type { FilterQuery, Model, SortOrder } from 'mongoose';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Generic pagination helper for Mongoose models.
 * Defaults: page=1, limit=20, max limit=100.
 */
export async function paginate<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  params: PaginationParams,
  options?: {
    sort?: Record<string, SortOrder>;
    populate?: string | { path: string; select?: string }[];
    select?: string;
    lean?: boolean;
  },
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  let query = model.find(filter);

  if (options?.sort) {
    query = query.sort(options.sort);
  }

  if (options?.populate) {
    if (typeof options.populate === 'string') {
      query = query.populate(options.populate);
    } else {
      for (const pop of options.populate) {
        query = query.populate(pop.path, pop.select);
      }
    }
  }

  if (options?.select) {
    query = query.select(options.select);
  }

  if (options?.lean !== false) {
    query = query.lean() as typeof query;
  }

  const [items, total] = await Promise.all([
    query.skip(skip).limit(limit),
    model.countDocuments(filter),
  ]);

  return {
    items: items as T[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Parse page/limit from Express query params.
 */
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  return {
    page: query.page ? Number(query.page) : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
  };
}
