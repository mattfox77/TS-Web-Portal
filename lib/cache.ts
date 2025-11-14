/**
 * Caching utilities for API responses and static assets
 * Leverages Cloudflare CDN edge caching
 */

export interface CacheConfig {
  maxAge?: number; // Browser cache duration in seconds
  sMaxAge?: number; // CDN cache duration in seconds
  staleWhileRevalidate?: number; // Serve stale content while revalidating
  public?: boolean; // Allow CDN caching
}

/**
 * Set cache headers on a Response object
 * @param response - The Response to add cache headers to
 * @param config - Cache configuration options
 * @returns Response with cache headers set
 */
export function setCacheHeaders(
  response: Response,
  config: CacheConfig = {}
): Response {
  const {
    maxAge = 0,
    sMaxAge = 3600,
    staleWhileRevalidate = 0,
    public: isPublic = true,
  } = config;

  const directives: string[] = [];

  if (isPublic) {
    directives.push('public');
  } else {
    directives.push('private');
  }

  if (maxAge > 0) {
    directives.push(`max-age=${maxAge}`);
  }

  if (sMaxAge > 0) {
    directives.push(`s-maxage=${sMaxAge}`);
  }

  if (staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  response.headers.set('Cache-Control', directives.join(', '));
  return response;
}

/**
 * Predefined cache configurations for common use cases
 */
export const CachePresets = {
  /**
   * No caching - always fetch fresh data
   */
  NO_CACHE: {
    maxAge: 0,
    sMaxAge: 0,
    public: false,
  } as CacheConfig,

  /**
   * Short cache - 5 minutes
   * Good for frequently changing data like dashboard stats
   */
  SHORT: {
    maxAge: 60,
    sMaxAge: 300,
    staleWhileRevalidate: 60,
    public: true,
  } as CacheConfig,

  /**
   * Medium cache - 1 hour
   * Good for semi-static data like project lists
   */
  MEDIUM: {
    maxAge: 300,
    sMaxAge: 3600,
    staleWhileRevalidate: 300,
    public: true,
  } as CacheConfig,

  /**
   * Long cache - 24 hours
   * Good for static data like service packages
   */
  LONG: {
    maxAge: 3600,
    sMaxAge: 86400,
    staleWhileRevalidate: 3600,
    public: true,
  } as CacheConfig,

  /**
   * Static assets - 1 year
   * For immutable assets with cache busting
   */
  STATIC: {
    maxAge: 31536000,
    sMaxAge: 31536000,
    public: true,
  } as CacheConfig,

  /**
   * Private data - no CDN caching
   * For user-specific data that shouldn't be cached at edge
   */
  PRIVATE: {
    maxAge: 60,
    sMaxAge: 0,
    public: false,
  } as CacheConfig,
};

/**
 * Generate cache key for request-based caching
 * @param request - The incoming request
 * @param additionalKeys - Additional keys to include in cache key
 * @returns Cache key string
 */
export function generateCacheKey(
  request: Request,
  additionalKeys: string[] = []
): string {
  const url = new URL(request.url);
  const keys = [
    url.pathname,
    url.search,
    ...additionalKeys,
  ];
  return keys.join('|');
}

/**
 * Add ETag header for conditional requests
 * @param response - The Response to add ETag to
 * @param content - Content to generate ETag from
 * @returns Response with ETag header
 */
export async function addETag(
  response: Response,
  content: string | ArrayBuffer
): Promise<Response> {
  const contentString = typeof content === 'string' 
    ? content 
    : new TextDecoder().decode(content);
  
  // Simple hash for ETag (in production, use crypto.subtle.digest)
  const hash = await simpleHash(contentString);
  response.headers.set('ETag', `"${hash}"`);
  return response;
}

/**
 * Simple hash function for ETag generation
 */
async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Check if request has matching ETag
 * @param request - The incoming request
 * @param etag - The current ETag value
 * @returns True if ETags match
 */
export function checkETag(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get('If-None-Match');
  return ifNoneMatch === `"${etag}"`;
}
