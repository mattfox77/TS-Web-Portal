/**
 * Pagination utilities for database queries
 * Implements cursor-based and offset-based pagination
 */

import { sql } from '@vercel/postgres';

export interface PaginationParams {
  page?: number;
  perPage?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: {
    next_cursor?: string;
    prev_cursor?: string;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Parse pagination parameters from request URL
 * @param url - Request URL
 * @returns Parsed pagination parameters
 */
export function parsePaginationParams(url: URL): PaginationParams {
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const perPage = parseInt(url.searchParams.get('per_page') || '20', 10);
  const cursor = url.searchParams.get('cursor') || undefined;

  return {
    page: Math.max(1, page),
    perPage: Math.min(100, Math.max(1, perPage)), // Limit to 100 items per page
    cursor,
  };
}

/**
 * Execute paginated query with offset-based pagination
 * @param baseQuery - SQL query without LIMIT/OFFSET
 * @param countQuery - SQL query to count total results
 * @param params - Query parameters
 * @param page - Page number (1-indexed)
 * @param perPage - Items per page
 * @returns Paginated results
 */
export async function paginateQuery<T>(
  baseQuery: string,
  countQuery: string,
  params: any[],
  page: number = 1,
  perPage: number = 20
): Promise<PaginatedResponse<T>> {
  const offset = (page - 1) * perPage;

  // Get total count
  const countResult = await sql.query(countQuery, params);
  const total = countResult.rows[0]?.count || 0;
  const totalPages = Math.ceil(total / perPage);

  // Get paginated data
  const paramCount = params.length;
  const query = `${baseQuery} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  const dataResult = await sql.query(query, [...params, perPage, offset]);

  return {
    data: dataResult.rows as T[],
    pagination: {
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    },
  };
}

/**
 * Execute paginated query with cursor-based pagination
 * More efficient for large datasets as it doesn't require counting
 * @param baseQuery - SQL query with WHERE clause placeholder for cursor
 * @param params - Query parameters
 * @param cursorColumn - Column to use for cursor (must be indexed)
 * @param cursor - Current cursor value
 * @param perPage - Items per page
 * @param direction - Pagination direction
 * @returns Cursor-paginated results
 */
export async function paginateQueryWithCursor<T extends Record<string, any>>(
  baseQuery: string,
  params: any[],
  cursorColumn: string,
  cursor?: string,
  perPage: number = 20,
  direction: 'next' | 'prev' = 'next'
): Promise<CursorPaginatedResponse<T>> {
  // Fetch one extra item to determine if there are more results
  const limit = perPage + 1;
  
  let query = baseQuery;
  const queryParams = [...params];
  let paramIndex = params.length + 1;

  if (cursor) {
    const operator = direction === 'next' ? '>' : '<';
    const orderDirection = direction === 'next' ? 'ASC' : 'DESC';
    
    // Add cursor condition
    query = query.replace(
      'ORDER BY',
      `AND ${cursorColumn} ${operator} $${paramIndex} ORDER BY`
    );
    query = query.replace(/ORDER BY .+ (ASC|DESC)/, `ORDER BY ${cursorColumn} ${orderDirection}`);
    queryParams.push(cursor);
    paramIndex++;
  }

  query += ` LIMIT $${paramIndex}`;
  queryParams.push(limit);

  const result = await sql.query(query, queryParams);

  // Check if there are more results
  const hasMore = result.rows.length > perPage;
  const data = hasMore ? result.rows.slice(0, perPage) : result.rows;

  // Generate cursors
  const nextCursor = hasMore && data.length > 0
    ? String(data[data.length - 1][cursorColumn])
    : undefined;
  
  const prevCursor = cursor; // Previous cursor is the current cursor

  return {
    data: data as T[],
    pagination: {
      next_cursor: nextCursor,
      prev_cursor: prevCursor,
      has_next: hasMore,
      has_prev: !!cursor,
    },
  };
}

/**
 * Build optimized WHERE clause with multiple filters
 * @param filters - Object with filter key-value pairs
 * @param startIndex - Starting parameter index (default 1)
 * @returns SQL WHERE clause and parameters
 */
export function buildWhereClause(
  filters: Record<string, any>,
  startIndex: number = 1
): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = startIndex;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        // IN clause for arrays
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`${key} IN (${placeholders})`);
        params.push(...value);
      } else if (typeof value === 'string' && value.includes('%')) {
        // LIKE clause for pattern matching
        conditions.push(`${key} LIKE $${paramIndex++}`);
        params.push(value);
      } else {
        // Equality check
        conditions.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    }
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, params };
}

/**
 * Build ORDER BY clause from sort parameters
 * @param sortBy - Column to sort by
 * @param sortOrder - Sort direction
 * @param allowedColumns - Whitelist of allowed sort columns
 * @returns SQL ORDER BY clause
 */
export function buildOrderByClause(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc',
  allowedColumns: string[] = []
): string {
  if (!sortBy || !allowedColumns.includes(sortBy)) {
    return '';
  }

  const direction = sortOrder.toUpperCase();
  return `ORDER BY ${sortBy} ${direction}`;
}

/**
 * Optimize query by adding appropriate indexes hint
 * Note: D1 automatically uses indexes, but this can help with query planning
 * @param query - SQL query
 * @param indexName - Index name to use
 * @returns Query with index hint
 */
export function addIndexHint(query: string, indexName: string): string {
  // SQLite doesn't support index hints in the same way as MySQL
  // This is a placeholder for documentation purposes
  return query;
}

/**
 * Calculate optimal batch size for bulk operations
 * @param totalItems - Total number of items to process
 * @param maxBatchSize - Maximum batch size
 * @returns Optimal batch size
 */
export function calculateBatchSize(
  totalItems: number,
  maxBatchSize: number = 100
): number {
  if (totalItems <= maxBatchSize) {
    return totalItems;
  }
  
  // Find a batch size that divides evenly or close to it
  for (let size = maxBatchSize; size > 10; size--) {
    if (totalItems % size === 0) {
      return size;
    }
  }
  
  return maxBatchSize;
}
