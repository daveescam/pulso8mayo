/**
 * Rate Limiter Implementation
 * 
 * A simple in-memory rate limiter using the sliding window algorithm.
 * For production use, consider using Redis or Upstash for distributed rate limiting.
 */

interface RateLimitEntry {
    timestamp: number;
    count: number;
}

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
}

// In-memory storage for rate limits
// Key: userId or IP address
// Value: Map of window timestamps to request counts
const rateLimitStore = new Map<string, Map<number, number>>();

// Default configurations
const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
};

// Critical endpoints have stricter limits
const CRITICAL_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000,
    maxRequests: 30, // 30 requests per minute for critical endpoints
};

// Auth endpoints have very strict limits
const AUTH_CONFIG: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 requests per 15 minutes
};

/**
 * Get rate limit configuration for a specific endpoint
 */
function getConfigForEndpoint(path: string): RateLimitConfig {
    // Auth endpoints
    if (path.includes('/api/auth/') || path.includes('/sign-in') || path.includes('/sign-up')) {
        return AUTH_CONFIG;
    }

    // Critical endpoints (inventory modifications, transfers, etc.)
    if (
        path.includes('/api/inventory/receiving') ||
        path.includes('/api/inventory/transfers') ||
        path.includes('/api/inventory/low-stock')
    ) {
        return CRITICAL_CONFIG;
    }

    // Default for all other endpoints
    return DEFAULT_CONFIG;
}

/**
 * Clean up old entries from the store
 */
function cleanupOldEntries(key: string, windowMs: number) {
    const now = Date.now();
    const windowStart = now - windowMs;

    const windows = rateLimitStore.get(key);
    if (!windows) return;

    // Remove windows older than the current window
    for (const [timestamp] of windows.entries()) {
        if (timestamp < windowStart) {
            windows.delete(timestamp);
        }
    }

    // Remove the key if no windows remain
    if (windows.size === 0) {
        rateLimitStore.delete(key);
    }
}

/**
 * Get current request count for a key within the window
 */
function getRequestCount(key: string, windowMs: number): number {
    const now = Date.now();
    const windowStart = now - windowMs;

    const windows = rateLimitStore.get(key);
    if (!windows) return 0;

    let count = 0;
    for (const [timestamp, windowCount] of windows.entries()) {
        if (timestamp >= windowStart) {
            count += windowCount;
        }
    }

    return count;
}

/**
 * Record a request for a key
 */
function recordRequest(key: string) {
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000; // Round to minute

    let windows = rateLimitStore.get(key);
    if (!windows) {
        windows = new Map();
        rateLimitStore.set(key, windows);
    }

    const currentCount = windows.get(windowStart) || 0;
    windows.set(windowStart, currentCount + 1);
}

/**
 * Check if a request is allowed and record it
 * 
 * @param identifier - User ID or IP address
 * @param path - Request path
 * @returns Object with rate limit information
 */
export function checkRateLimit(
    identifier: string,
    path: string
): {
    allowed: boolean;
    remaining: number;
    limit: number;
    reset: number;
    retryAfter?: number;
} {
    const config = getConfigForEndpoint(path);
    const { windowMs, maxRequests } = config;

    // Clean up old entries
    cleanupOldEntries(identifier, windowMs);

    // Get current count
    const currentCount = getRequestCount(identifier, windowMs);

    // Calculate reset time
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const reset = windowStart + windowMs;

    // Check if allowed
    if (currentCount >= maxRequests) {
        const retryAfter = Math.ceil((reset - now) / 1000);
        return {
            allowed: false,
            remaining: 0,
            limit: maxRequests,
            reset,
            retryAfter,
        };
    }

    // Record the request
    recordRequest(identifier);

    return {
        allowed: true,
        remaining: maxRequests - currentCount - 1,
        limit: maxRequests,
        reset,
    };
}

/**
 * Get rate limit status without recording a request
 */
export function getRateLimitStatus(
    identifier: string,
    path: string
): {
    remaining: number;
    limit: number;
    reset: number;
    used: number;
} {
    const config = getConfigForEndpoint(path);
    const { windowMs, maxRequests } = config;

    const currentCount = getRequestCount(identifier, windowMs);
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const reset = windowStart + windowMs;

    return {
        remaining: Math.max(0, maxRequests - currentCount),
        limit: maxRequests,
        reset,
        used: currentCount,
    };
}

/**
 * Reset rate limit for a specific identifier
 */
export function resetRateLimit(identifier: string) {
    rateLimitStore.delete(identifier);
}

/**
 * Middleware helper for Next.js
 * Returns headers to add to response and whether to block the request
 */
export function createRateLimitHeaders(
    result: ReturnType<typeof checkRateLimit>
): {
    headers: Record<string, string>;
    shouldBlock: boolean;
    retryAfter?: number;
} {
    const headers: Record<string, string> = {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.floor(result.reset / 1000).toString(),
    };

    if (result.retryAfter) {
        headers['Retry-After'] = result.retryAfter.toString();
    }

    return {
        headers,
        shouldBlock: !result.allowed,
        retryAfter: result.retryAfter,
    };
}

/**
 * Periodic cleanup of old entries (run every 5 minutes)
 */
export function startRateLimitCleanup() {
    setInterval(() => {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes

        for (const [key, windows] of rateLimitStore.entries()) {
            for (const [timestamp] of windows.entries()) {
                if (timestamp < now - maxAge) {
                    windows.delete(timestamp);
                }
            }
            if (windows.size === 0) {
                rateLimitStore.delete(key);
            }
        }

        console.log(`[RateLimit] Cleanup completed. Active keys: ${rateLimitStore.size}`);
    }, 5 * 60 * 1000); // Every 5 minutes
}

// Start cleanup on module load (in development)
if (process.env.NODE_ENV === 'development') {
    startRateLimitCleanup();
}
