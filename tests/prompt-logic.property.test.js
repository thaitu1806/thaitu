/**
 * Feature: progressive-parent-linking, Property 4: Prompt trigger conditions
 *
 * For any player with link_status = `unlinked` and session_count ≥ 1 and
 * last_prompt_date ≠ today, the prompt decision function should return a prompt.
 *
 * For any player with link_status = `prompted` and (session_count ≥ 5 OR
 * current_streak ≥ 3) and last_prompt_date ≠ today, the prompt decision function
 * should return a milestone reminder.
 *
 * Validates: Requirements 3.1, 3.3, 4.1, 4.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { shouldShowPrompt } from '../lib/prompt-logic.js';

/**
 * Helper: generate a date string that is NOT today (in the past or null).
 */
function notTodayDateArb() {
  const today = new Date().toISOString().split('T')[0];
  return fc.oneof(
    fc.constant(null),
    // Generate past dates (1-365 days ago)
    fc.integer({ min: 1, max: 365 }).map(daysAgo => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    })
  ).filter(date => date !== today);
}

describe('Property 4: Prompt trigger conditions', () => {
  /**
   * **Validates: Requirements 3.1, 3.3**
   *
   * Property: For any player with status 'unlinked', session_count >= 1,
   * and last_prompt_date != today, shouldShowPrompt returns the soft prompt message.
   */
  it('unlinked player with session_count >= 1 and last_prompt_date != today always gets soft prompt', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),      // session_count >= 1
        fc.integer({ min: 0, max: 1000 }),       // current_streak (any value, irrelevant for unlinked)
        notTodayDateArb(),                        // last_prompt_date != today
        (sessionCount, currentStreak, lastPromptDate) => {
          const result = shouldShowPrompt('unlinked', sessionCount, currentStreak, lastPromptDate);

          // Should return the soft prompt message
          expect(result).toBe('Muốn ba mẹ xem thành tích không? 🌟');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 4.1, 4.2**
   *
   * Property: For any player with status 'prompted', session_count >= 5,
   * and last_prompt_date != today, shouldShowPrompt returns the session milestone message.
   */
  it('prompted player with session_count >= 5 and last_prompt_date != today always gets session milestone prompt', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 10000 }),      // session_count >= 5
        fc.integer({ min: 0, max: 1000 }),       // current_streak (any value)
        notTodayDateArb(),                        // last_prompt_date != today
        (sessionCount, currentStreak, lastPromptDate) => {
          const result = shouldShowPrompt('prompted', sessionCount, currentStreak, lastPromptDate);

          // Should return the session milestone message
          expect(result).toBe('Ba mẹ sẽ tự hào lắm đó! Liên kết ngay nhé 🏆');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 4.1, 4.2**
   *
   * Property: For any player with status 'prompted', current_streak >= 3,
   * session_count < 5, and last_prompt_date != today, shouldShowPrompt returns
   * the streak milestone message.
   */
  it('prompted player with current_streak >= 3 and session_count < 5 and last_prompt_date != today always gets streak milestone prompt', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),          // session_count < 5 (so streak condition takes priority)
        fc.integer({ min: 3, max: 1000 }),       // current_streak >= 3
        notTodayDateArb(),                        // last_prompt_date != today
        (sessionCount, currentStreak, lastPromptDate) => {
          const result = shouldShowPrompt('prompted', sessionCount, currentStreak, lastPromptDate);

          // Should return the streak milestone message
          expect(result).toBe('Con giỏi quá! Cho ba mẹ biết nhé 🔥');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.1, 4.1, 4.2**
   *
   * Property: For any eligible player (unlinked or prompted meeting trigger conditions),
   * the function always returns a non-null string (a prompt is shown).
   */
  it('eligible players always receive a non-null prompt response', () => {
    // Arbitrary for eligible player states
    const eligiblePlayerArb = fc.oneof(
      // Unlinked with session_count >= 1
      fc.record({
        status: fc.constant('unlinked'),
        sessionCount: fc.integer({ min: 1, max: 10000 }),
        currentStreak: fc.integer({ min: 0, max: 1000 }),
        lastPromptDate: notTodayDateArb()
      }),
      // Prompted with session_count >= 5
      fc.record({
        status: fc.constant('prompted'),
        sessionCount: fc.integer({ min: 5, max: 10000 }),
        currentStreak: fc.integer({ min: 0, max: 1000 }),
        lastPromptDate: notTodayDateArb()
      }),
      // Prompted with current_streak >= 3
      fc.record({
        status: fc.constant('prompted'),
        sessionCount: fc.integer({ min: 0, max: 10000 }),
        currentStreak: fc.integer({ min: 3, max: 1000 }),
        lastPromptDate: notTodayDateArb()
      })
    );

    fc.assert(
      fc.property(
        eligiblePlayerArb,
        ({ status, sessionCount, currentStreak, lastPromptDate }) => {
          const result = shouldShowPrompt(status, sessionCount, currentStreak, lastPromptDate);

          // Should always return a non-null prompt
          expect(result).not.toBeNull();
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: progressive-parent-linking, Property 5: Once-per-day prompt constraint
 *
 * For any player where last_prompt_date equals today's date, the prompt decision
 * function should return no prompt, regardless of session_count or streak values.
 *
 * For any linked player, the function always returns null regardless of any other values.
 *
 * Validates: Requirements 3.5, 4.4
 */

describe('Property 5: Once-per-day prompt constraint', () => {
  const today = new Date().toISOString().split('T')[0];

  /**
   * **Validates: Requirements 3.5, 4.4**
   *
   * Property: For any player where last_prompt_date equals today,
   * shouldShowPrompt returns null regardless of status, session_count, or streak.
   */
  it('player with last_prompt_date === today never gets a prompt', () => {
    const statusArb = fc.constantFrom('unlinked', 'prompted');

    fc.assert(
      fc.property(
        statusArb,
        fc.integer({ min: 0, max: 10000 }),   // sessionCount (arbitrary)
        fc.integer({ min: 0, max: 1000 }),    // currentStreak (arbitrary)
        (status, sessionCount, currentStreak) => {
          const result = shouldShowPrompt(status, sessionCount, currentStreak, today);

          // Should always return null — once-per-day constraint
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.5, 4.4**
   *
   * Property: For any linked player, shouldShowPrompt always returns null
   * regardless of session_count, streak, or last_prompt_date.
   */
  it('linked player always gets null regardless of other values', () => {
    const lastPromptDateArb = fc.oneof(
      fc.constant(null),
      fc.constant(today),
      // Past dates
      fc.integer({ min: 1, max: 365 }).map(daysAgo => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
      })
    );

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),   // sessionCount (arbitrary)
        fc.integer({ min: 0, max: 1000 }),    // currentStreak (arbitrary)
        lastPromptDateArb,                     // any last_prompt_date
        (sessionCount, currentStreak, lastPromptDate) => {
          const result = shouldShowPrompt('linked', sessionCount, currentStreak, lastPromptDate);

          // Linked players should never see a prompt
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.5, 4.4**
   *
   * Property: Even when all other conditions would trigger a prompt
   * (eligible status + high session count + high streak), if last_prompt_date
   * is today, the result is still null.
   */
  it('eligible players still get null when last_prompt_date is today', () => {
    // Generate players that would otherwise qualify for a prompt
    const eligiblePlayerArb = fc.oneof(
      // Unlinked with session_count >= 1
      fc.record({
        status: fc.constant('unlinked'),
        sessionCount: fc.integer({ min: 1, max: 10000 }),
        currentStreak: fc.integer({ min: 0, max: 1000 })
      }),
      // Prompted with session_count >= 5
      fc.record({
        status: fc.constant('prompted'),
        sessionCount: fc.integer({ min: 5, max: 10000 }),
        currentStreak: fc.integer({ min: 0, max: 1000 })
      }),
      // Prompted with streak >= 3
      fc.record({
        status: fc.constant('prompted'),
        sessionCount: fc.integer({ min: 0, max: 4 }),
        currentStreak: fc.integer({ min: 3, max: 1000 })
      })
    );

    fc.assert(
      fc.property(
        eligiblePlayerArb,
        ({ status, sessionCount, currentStreak }) => {
          const result = shouldShowPrompt(status, sessionCount, currentStreak, today);

          // Even eligible players should get null if already prompted today
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
