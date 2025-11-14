import { NextRequest, NextResponse } from "next/server";

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message, "UNAUTHORIZED");
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message, "FORBIDDEN");
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, "NOT_FOUND");
  }
}

/**
 * Validation error (422)
 */
export class ValidationError extends AppError {
  constructor(details: Record<string, any>) {
    super(422, "Validation failed", "VALIDATION_ERROR", details);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, "CONFLICT");
  }
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Handle errors and return appropriate response
 * Logs errors with context for debugging
 */
export function handleError(error: unknown, context?: Record<string, any>): NextResponse<ErrorResponse> {
  if (error instanceof AppError) {
    // Log application errors with context
    logError(error, context);
    
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Log unexpected errors with full details
  logError(error, context);

  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}

/**
 * Log error with context for debugging
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  
  if (error instanceof Error) {
    console.error(`[${timestamp}] Error:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
    });
  } else {
    console.error(`[${timestamp}] Unknown error:`, {
      error,
      context,
    });
  }
}

/**
 * Async error handler wrapper for API routes
 * Wraps an async handler function with try-catch and error handling
 * 
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   // Your handler code
 *   return NextResponse.json({ data });
 * });
 */
export function withErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error, {
        url: request.url,
        method: request.method,
        params: context?.params,
      });
    }
  };
}

/**
 * Database error handler
 * Wraps database operations with error handling
 */
export async function withDatabaseErrorHandler<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(error, { operation: operationName });
    throw new AppError(
      500,
      'Database operation failed',
      'DB_ERROR',
      { operation: operationName }
    );
  }
}

/**
 * External API error handler
 * Wraps external API calls with error handling
 */
export async function withExternalApiErrorHandler<T>(
  operation: () => Promise<T>,
  apiName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(error, { api: apiName });
    throw new AppError(
      502,
      `External API error: ${apiName}`,
      'EXTERNAL_API_ERROR',
      { api: apiName }
    );
  }
}
