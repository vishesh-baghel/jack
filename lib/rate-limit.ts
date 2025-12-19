/**
 * Simple in-memory rate limiter
 * For auth endpoint protection against brute force
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on server restart - fine for this use case)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Max attempts per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxAttempts: 5, // 5 attempts per minute
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
}

/**
 * Check if a request is rate limited
 * @param identifier - Unique identifier (IP address, etc.)
 * @param config - Rate limit configuration
 */
export const checkRateLimit = (
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult => {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  // No existing entry or expired
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetIn: Math.ceil(config.windowMs / 1000),
    };
  }

  // Existing entry, check if over limit
  if (entry.count >= config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  // Increment count
  entry.count += 1;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  };
};

/**
 * Get client IP from request headers
 */
export const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback - not ideal but better than nothing
  return 'unknown';
};

// Spicy rate limit error messages
export const RATE_LIMIT_MESSAGES = [
  "slow down speedrunner. try again in {seconds}s",
  "the grind is real but chill for {seconds}s",
  "too many attempts. touch grass for {seconds}s",
  "brute force detected. wait {seconds}s",
  "you're not that guy pal. try again in {seconds}s",
];

export const getRandomRateLimitMessage = (seconds: number): string => {
  const message = RATE_LIMIT_MESSAGES[Math.floor(Math.random() * RATE_LIMIT_MESSAGES.length)];
  return message.replace('{seconds}', String(seconds));
};
