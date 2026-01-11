/**
 * Simple in-memory rate limiter
 * For production, consider Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Rate limit configuration
const CONFIG = {
  // Per-user limits
  USER_REQUESTS_PER_MINUTE: 10,
  USER_REQUESTS_PER_HOUR: 60,

  // Global limits (all users combined)
  GLOBAL_REQUESTS_PER_MINUTE: 100,

  // Concurrent connections per user
  MAX_CONCURRENT_CONNECTIONS: 3,
};

// Storage
const userMinuteRequests = new Map<string, RateLimitEntry>();
const userHourRequests = new Map<string, RateLimitEntry>();
const globalMinuteRequests: RateLimitEntry = { count: 0, resetTime: Date.now() + 60000 };
const userConnections = new Map<string, number>();

/**
 * Check if a request should be rate limited
 * @returns Object with allowed boolean and reason if blocked
 */
export function checkRateLimit(userId: string): { allowed: boolean; reason?: string; retryAfter?: number } {
  const now = Date.now();

  // Check global rate limit
  if (now > globalMinuteRequests.resetTime) {
    globalMinuteRequests.count = 0;
    globalMinuteRequests.resetTime = now + 60000;
  }
  if (globalMinuteRequests.count >= CONFIG.GLOBAL_REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      reason: 'Global rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((globalMinuteRequests.resetTime - now) / 1000),
    };
  }

  // Check user per-minute limit
  let userMinute = userMinuteRequests.get(userId);
  if (!userMinute || now > userMinute.resetTime) {
    userMinute = { count: 0, resetTime: now + 60000 };
    userMinuteRequests.set(userId, userMinute);
  }
  if (userMinute.count >= CONFIG.USER_REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      reason: `Rate limit exceeded (${CONFIG.USER_REQUESTS_PER_MINUTE}/minute). Please slow down.`,
      retryAfter: Math.ceil((userMinute.resetTime - now) / 1000),
    };
  }

  // Check user per-hour limit
  let userHour = userHourRequests.get(userId);
  if (!userHour || now > userHour.resetTime) {
    userHour = { count: 0, resetTime: now + 3600000 };
    userHourRequests.set(userId, userHour);
  }
  if (userHour.count >= CONFIG.USER_REQUESTS_PER_HOUR) {
    return {
      allowed: false,
      reason: `Hourly rate limit exceeded (${CONFIG.USER_REQUESTS_PER_HOUR}/hour). Please try again later.`,
      retryAfter: Math.ceil((userHour.resetTime - now) / 1000),
    };
  }

  // Increment counters
  globalMinuteRequests.count++;
  userMinute.count++;
  userHour.count++;

  return { allowed: true };
}

/**
 * Track connection count for a user
 * @returns true if connection is allowed, false if limit exceeded
 */
export function trackConnection(userId: string): boolean {
  const current = userConnections.get(userId) || 0;
  if (current >= CONFIG.MAX_CONCURRENT_CONNECTIONS) {
    return false;
  }
  userConnections.set(userId, current + 1);
  return true;
}

/**
 * Release a connection slot for a user
 */
export function releaseConnection(userId: string): void {
  const current = userConnections.get(userId) || 0;
  if (current > 0) {
    userConnections.set(userId, current - 1);
  }
}

/**
 * Get current rate limit status for a user (for debugging/monitoring)
 */
export function getRateLimitStatus(userId: string): {
  minuteUsed: number;
  minuteLimit: number;
  hourUsed: number;
  hourLimit: number;
  connections: number;
  connectionLimit: number;
} {
  const userMinute = userMinuteRequests.get(userId);
  const userHour = userHourRequests.get(userId);

  return {
    minuteUsed: userMinute?.count || 0,
    minuteLimit: CONFIG.USER_REQUESTS_PER_MINUTE,
    hourUsed: userHour?.count || 0,
    hourLimit: CONFIG.USER_REQUESTS_PER_HOUR,
    connections: userConnections.get(userId) || 0,
    connectionLimit: CONFIG.MAX_CONCURRENT_CONNECTIONS,
  };
}
