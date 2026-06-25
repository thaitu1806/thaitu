/**
 * Feature: progressive-parent-linking, Property 9: Rate limiting blocks after threshold
 *
 * For any IP address that has made 5 failed link-by-code attempts within a 10-minute window,
 * the next attempt from that IP should be rejected (HTTP 429) regardless of whether the
 * provided code is valid.
 *
 * Validates: Requirements 9.3
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { checkRateLimit, rateLimitMap, RATE_LIMIT_WINDOW, RATE_LIMIT_MAX } from '../api/parent.js';

// Arbitrary for IP addresses
const ipArb = fc.tuple(
  fc.integer({ min: 1, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 1, max: 254 })
).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

describe('Property 9: Rate limiting blocks after threshold', () => {
  beforeEach(() => {
    rateLimitMap.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * Property: For any IP address, the first RATE_LIMIT_MAX (5) calls to checkRateLimit
   * within the rate limit window should return true (allowed), and the 6th call onward
   * should return false (blocked).
   */
  it('any IP is blocked after exactly RATE_LIMIT_MAX attempts within the window', () => {
    fc.assert(
      fc.property(
        ipArb,
        // Number of extra attempts beyond the threshold (1 to 10)
        fc.integer({ min: 1, max: 10 }),
        (ip, extraAttempts) => {
          rateLimitMap.clear();

          // First RATE_LIMIT_MAX calls should all be allowed
          for (let i = 0; i < RATE_LIMIT_MAX; i++) {
            const allowed = checkRateLimit(ip);
            expect(allowed).toBe(true);
          }

          // All subsequent attempts within the window should be blocked
          for (let i = 0; i < extraAttempts; i++) {
            const blocked = checkRateLimit(ip);
            expect(blocked).toBe(false);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * Property: Rate limiting is per-IP. For any two distinct IPs, one being rate-limited
   * does not affect the other.
   */
  it('rate limiting is isolated per IP - blocking one IP does not affect others', () => {
    fc.assert(
      fc.property(
        ipArb,
        ipArb,
        (ip1, ip2) => {
          // Skip when both IPs are the same
          fc.pre(ip1 !== ip2);

          rateLimitMap.clear();

          // Exhaust rate limit for ip1
          for (let i = 0; i < RATE_LIMIT_MAX; i++) {
            checkRateLimit(ip1);
          }

          // ip1 should be blocked
          expect(checkRateLimit(ip1)).toBe(false);

          // ip2 should still be allowed (independent rate limit)
          expect(checkRateLimit(ip2)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * Property: After the rate limit window expires (10 minutes), a previously blocked IP
   * should be allowed again, effectively resetting the counter.
   */
  it('rate limit resets after the window expires', () => {
    fc.assert(
      fc.property(
        ipArb,
        (ip) => {
          rateLimitMap.clear();

          // Exhaust rate limit
          for (let i = 0; i < RATE_LIMIT_MAX; i++) {
            checkRateLimit(ip);
          }

          // Should be blocked now
          expect(checkRateLimit(ip)).toBe(false);

          // Advance time past the rate limit window
          vi.advanceTimersByTime(RATE_LIMIT_WINDOW + 1);

          // Should be allowed again after window expires
          expect(checkRateLimit(ip)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * **Validates: Requirements 9.3**
   *
   * Property: For any IP that has been blocked, the checkRateLimit function
   * consistently returns false for all subsequent calls within the window,
   * regardless of how many extra attempts are made.
   */
  it('once blocked, all subsequent attempts within window are consistently rejected', () => {
    fc.assert(
      fc.property(
        ipArb,
        // Random number of additional attempts after being blocked
        fc.integer({ min: 1, max: 50 }),
        (ip, additionalAttempts) => {
          rateLimitMap.clear();

          // Exhaust rate limit
          for (let i = 0; i < RATE_LIMIT_MAX; i++) {
            checkRateLimit(ip);
          }

          // Every single subsequent attempt must be blocked
          for (let i = 0; i < additionalAttempts; i++) {
            expect(checkRateLimit(ip)).toBe(false);
          }

          // Verify the count doesn't keep growing beyond RATE_LIMIT_MAX
          const entry = rateLimitMap.get(ip);
          expect(entry.count).toBe(RATE_LIMIT_MAX);
        }
      ),
      { numRuns: 200 }
    );
  });
});
