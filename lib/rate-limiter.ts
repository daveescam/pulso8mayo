/**
 * Rate Limiter Implementation
 * 
 * Redis-based rate limiter using Upstash Redis for production.
 * Falls back to in-memory implementation when Redis is not available.
 */

import { Redis } from '@upstash/redis';
import { env } from './env';
import { createChildLogger } from './logger';

const logger = createChildLogger('rate-limiter');

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
    if (!redisClient && env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
        redisClient = new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
        });
    }
    return redisClient;
}

const rateLimitStore = new Map<string, Map<number, number>>();

const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000,
    maxRequests: 100,
};

const CRITICAL_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000,
    maxRequests: 30,
};

const AUTH_CONFIG: RateLimitConfig = {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
};

let redisAvailable: boolean | null = null;

function checkRedisAvailability(): boolean {
    if (redisAvailable === null) {
        redisAvailable = getRedisClient() !== null;
        if (redisAvailable) {
            logger.info('Using Redis for rate limiting');
        } else {
            logger.warn('Redis not available, falling back to in-memory rate limiting');
        }
    }
    return redisAvailable;
}

function getConfigForEndpoint(path: string): RateLimitConfig {
    if (path.includes('/api/auth/') || path.includes('/sign-in') || path.includes('/sign-up')) {
        return AUTH_CONFIG;
    }

    if (
        path.includes('/api/inventory/receiving') ||
        path.includes('/api/inventory/transfers') ||
        path.includes('/api/inventory/low-stock')
    ) {
        return CRITICAL_CONFIG;
    }

    return DEFAULT_CONFIG;
}

function cleanupOldEntries(key: string, windowMs: number) {
    const now = Date.now();
    const windowStart = now - windowMs;

    const windows = rateLimitStore.get(key);
    if (!windows) return;

    for (const timestamp of Array.from(windows.keys())) {
        if (timestamp < windowStart) {
            windows.delete(timestamp);
        }
    }

    if (windows.size === 0) {
        rateLimitStore.delete(key);
    }
}

function getMemoryRequestCount(key: string, windowMs: number): number {
    const now = Date.now();
    const windowStart = now - windowMs;

    const windows = rateLimitStore.get(key);
    if (!windows) return 0;

    let count = 0;
    for (const [timestamp, windowCount] of Array.from(windows.entries())) {
        if (timestamp >= windowStart) {
            count += windowCount;
        }
    }

    return count;
}

function recordMemoryRequest(key: string) {
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000;

    let windows = rateLimitStore.get(key);
    if (!windows) {
        windows = new Map();
        rateLimitStore.set(key, windows);
    }

    const currentCount = windows.get(windowStart) || 0;
    windows.set(windowStart, currentCount + 1);
}

async function getRedisRequestCount(key: string, windowMs: number): Promise<number> {
    const redis = getRedisClient();
    if (!redis) return 0;

    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Use zcount to get the number of elements in the score range
    const count = await redis.zcount(key, windowStart, now);
    return count || 0;
}

async function recordRedisRequest(key: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000;
    
    await redis.zadd(key, { score: windowStart, member: `${now}-${Math.random()}` });
    await redis.expire(key, 120);
}

async function cleanupOldRedisEntries(key: string, windowMs: number): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    const now = Date.now();
    const windowStart = now - windowMs;
    await redis.zremrangebyscore(key, 0, windowStart);
}

/**
 * Check if a request is allowed and record it (Redis-backed async version)
 */
export async function checkRateLimit(
    identifier: string,
    path: string
): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
    reset: number;
    retryAfter?: number;
}> {
    const config = getConfigForEndpoint(path);
    const { windowMs, maxRequests } = config;
    const useRedis = checkRedisAvailability();

    if (useRedis) {
        await cleanupOldRedisEntries(identifier, windowMs);
        const currentCount = await getRedisRequestCount(identifier, windowMs);

        const now = Date.now();
        const windowStart = Math.floor(now / windowMs) * windowMs;
        const reset = windowStart + windowMs;

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

        await recordRedisRequest(identifier);

        return {
            allowed: true,
            remaining: maxRequests - currentCount - 1,
            limit: maxRequests,
            reset,
        };
    }

    // In-memory fallback
    cleanupOldEntries(identifier, windowMs);
    const currentCount = getMemoryRequestCount(identifier, windowMs);

    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const reset = windowStart + windowMs;

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

    recordMemoryRequest(identifier);

    return {
        allowed: true,
        remaining: maxRequests - currentCount - 1,
        limit: maxRequests,
        reset,
    };
}

/**
 * Sync wrapper for middleware compatibility
 * Uses in-memory store when Redis is not available
 */
export function checkRateLimitSync(
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

    cleanupOldEntries(identifier, windowMs);
    const currentCount = getMemoryRequestCount(identifier, windowMs);

    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const reset = windowStart + windowMs;

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

    recordMemoryRequest(identifier);

    return {
        allowed: true,
        remaining: maxRequests - currentCount - 1,
        limit: maxRequests,
        reset,
    };
}

/**
 * Get rate limit status (async)
 */
export async function getRateLimitStatus(
    identifier: string,
    path: string
): Promise<{
    remaining: number;
    limit: number;
    reset: number;
    used: number;
}> {
    const config = getConfigForEndpoint(path);
    const { windowMs, maxRequests } = config;
    const useRedis = checkRedisAvailability();

    let currentCount: number;
    if (useRedis) {
        currentCount = await getRedisRequestCount(identifier, windowMs);
    } else {
        currentCount = getMemoryRequestCount(identifier, windowMs);
    }

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
 * Get rate limit status (sync)
 */
export function getRateLimitStatusSync(
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

    const currentCount = getMemoryRequestCount(identifier, windowMs);
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
export async function resetRateLimit(identifier: string) {
    const redis = getRedisClient();
    if (redis) {
        await redis.del(`ratelimit:${identifier}`);
    }
    rateLimitStore.delete(identifier);
}

/**
 * Reset rate limit (sync - in-memory only)
 */
export function resetRateLimitSync(identifier: string) {
    rateLimitStore.delete(identifier);
}

/**
 * Middleware helper for Next.js
 */
export function createRateLimitHeaders(
    result: ReturnType<typeof checkRateLimitSync>
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