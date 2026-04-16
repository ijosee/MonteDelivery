// src/lib/rate-limit.ts
// Simple in-memory rate limiting for auth endpoints.
// Requisitos: 25.3, 25.4

import { MVP_CONSTANTS } from '@/lib/constants';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * Check if a request from the given IP is rate-limited.
 * Returns { limited: false } if allowed, or { limited: true, retryAfterSeconds } if blocked.
 *
 * Default: 10 attempts per minute per IP for auth endpoints.
 */
export function checkRateLimit(
  ip: string,
  maxAttempts: number = MVP_CONSTANTS.AUTH_RATE_LIMIT_PER_MINUTE,
  windowMs: number = 60 * 1000
): { limited: boolean; retryAfterSeconds?: number } {
  cleanup();

  const now = Date.now();
  const key = `auth:${ip}`;
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, retryAfterSeconds };
  }

  entry.count++;
  return { limited: false };
}

/**
 * Reset rate limit for an IP (e.g., after successful login).
 */
export function resetRateLimit(ip: string): void {
  store.delete(`auth:${ip}`);
}
