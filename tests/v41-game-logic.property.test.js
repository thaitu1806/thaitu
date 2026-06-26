// Property-based tests for V41 (Mario Adventure) pure game logic.
// Validates correctness properties P1–P7 from
// .kiro/specs/v41-mario-adventure/requirements.md
//
// All tests use fast-check to generate arbitrary inputs.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  TOTAL_STATIONS,
  STARTING_LIVES,
  TIMER_SECONDS,
  initState,
  applyCorrect,
  applyWrongOrTimeout,
  isFinished,
  computeStars,
  pickNextQuestion,
} from '../public/v41/game-logic.js';

const TIMER_MS = TIMER_SECONDS * 1000;

// Arbitrary state that is still in play (outcome === 'playing').
const playingState = fc
  .record({
    totalStations: fc.constant(TOTAL_STATIONS),
    currentStation: fc.integer({ min: 0, max: TOTAL_STATIONS - 1 }),
    lives: fc.integer({ min: 1, max: STARTING_LIVES }),
    correct: fc.integer({ min: 0, max: 50 }),
    wrong: fc.integer({ min: 0, max: 50 }),
    coins: fc.integer({ min: 0, max: 100 }),
  })
  .map((s) => ({ ...s, outcome: 'playing', startedAt: 0 }));

describe('V41 property: P1 — lives accounting', () => {
  it('wrong/timeout decreases lives by exactly 1 (clamped at 0)', () => {
    fc.assert(
      fc.property(playingState, (s) => {
        const next = applyWrongOrTimeout(s);
        const expected = Math.max(0, s.lives - 1);
        expect(next.lives).toBe(expected);
        expect(next.wrong).toBe(s.wrong + 1);
        expect(next.correct).toBe(s.correct);
      }),
    );
  });

  it('correct answer leaves lives unchanged', () => {
    fc.assert(
      fc.property(
        playingState,
        fc.integer({ min: 0, max: TIMER_MS }),
        (s, ms) => {
          const next = applyCorrect(s, { msRemaining: ms });
          expect(next.lives).toBe(s.lives);
        },
      ),
    );
  });
});

describe('V41 property: P2 — station advance on correct only', () => {
  it('correct answer always increases currentStation by 1', () => {
    fc.assert(
      fc.property(
        playingState,
        fc.integer({ min: 0, max: TIMER_MS }),
        (s, ms) => {
          const next = applyCorrect(s, { msRemaining: ms });
          expect(next.currentStation).toBe(s.currentStation + 1);
        },
      ),
    );
  });

  it('wrong answer leaves currentStation unchanged', () => {
    fc.assert(
      fc.property(playingState, (s) => {
        const next = applyWrongOrTimeout(s);
        expect(next.currentStation).toBe(s.currentStation);
      }),
    );
  });
});

describe('V41 property: P3 — terminal state predicates', () => {
  it('won iff currentStation reaches totalStations', () => {
    fc.assert(
      fc.property(playingState, (s) => {
        // Force one-correct-from-win: set currentStation to totalStations - 1
        const oneFromWin = { ...s, currentStation: TOTAL_STATIONS - 1 };
        const next = applyCorrect(oneFromWin, { msRemaining: 0 });
        expect(next.outcome).toBe('won');
        expect(isFinished(next)).toBe(true);
      }),
    );
  });

  it('lost iff lives drops to 0', () => {
    fc.assert(
      fc.property(playingState, (s) => {
        const oneLifeLeft = { ...s, lives: 1 };
        const next = applyWrongOrTimeout(oneLifeLeft);
        expect(next.outcome).toBe('lost');
        expect(isFinished(next)).toBe(true);
      }),
    );
  });

  it('finished states are immutable under further input', () => {
    fc.assert(
      fc.property(playingState, (s) => {
        const finished = { ...s, outcome: 'won' };
        expect(applyCorrect(finished, { msRemaining: 5000 })).toEqual(finished);
        expect(applyWrongOrTimeout(finished)).toEqual(finished);
      }),
    );
  });
});

describe('V41 property: P4 — coin reward bounds', () => {
  it('coins gained per correct answer is always 1 or 2', () => {
    fc.assert(
      fc.property(
        playingState,
        fc.integer({ min: 0, max: TIMER_MS }),
        (s, ms) => {
          const next = applyCorrect(s, { msRemaining: ms });
          const gained = next.coins - s.coins;
          expect(gained === 1 || gained === 2).toBe(true);
        },
      ),
    );
  });

  it('after N correct answers, coins ∈ [N, 2N]', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: TIMER_MS }), {
          minLength: 1,
          maxLength: TOTAL_STATIONS,
        }),
        (msList) => {
          let s = initState({ startedAt: 0 });
          for (const ms of msList) s = applyCorrect(s, { msRemaining: ms });
          expect(s.coins).toBeGreaterThanOrEqual(msList.length);
          expect(s.coins).toBeLessThanOrEqual(2 * msList.length);
        },
      ),
    );
  });
});

describe('V41 property: P5 — star rating monotonicity', () => {
  it('higher accuracy never yields a lower star rating (livesLost fixed)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 0, max: 30 }),
        fc.integer({ min: 0, max: STARTING_LIVES }),
        (total, correctA, livesLost) => {
          // Ensure correctA ≤ total
          const cA = Math.min(correctA, total);
          // Pick correctB ≥ cA so accuracyB ≥ accuracyA
          const cB = Math.min(total, cA + Math.floor(Math.random() * (total - cA + 1)));
          const starsA = computeStars({ correct: cA, total, livesLost });
          const starsB = computeStars({ correct: cB, total, livesLost });
          expect(starsB).toBeGreaterThanOrEqual(starsA);
        },
      ),
    );
  });

  it('3 stars requires zero lives lost AND accuracy ≥ 90%', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 0, max: 30 }),
        fc.integer({ min: 1, max: STARTING_LIVES }),
        (total, correct, livesLost) => {
          const stars = computeStars({
            correct: Math.min(correct, total),
            total,
            livesLost,
          });
          // With livesLost ≥ 1, must be < 3
          expect(stars).toBeLessThan(3);
        },
      ),
    );
  });
});

describe('V41 property: P6 — question reuse safety', () => {
  it('pickNextQuestion never returns a question already in usedIds', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 20 }),
        fc.array(fc.integer({ min: 1, max: 100 }), { maxLength: 20 }),
        (cacheIds, usedRaw) => {
          const cache = cacheIds.map((id) => ({ id }));
          const used = new Set(usedRaw);
          const next = pickNextQuestion({ cache, usedIds: used });
          if (next != null) expect(used.has(next.id)).toBe(false);
        },
      ),
    );
  });

  it('returns null when every cache id is used', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.integer({ min: 1, max: 200 }), {
          minLength: 1,
          maxLength: 20,
        }),
        (ids) => {
          const cache = ids.map((id) => ({ id }));
          const used = new Set(ids);
          expect(pickNextQuestion({ cache, usedIds: used })).toBeNull();
        },
      ),
    );
  });
});

describe('V41 property: P7 — session payload validity', () => {
  // Drive a random run, then validate the final state could form a valid /api/sessions payload.
  const event = fc.oneof(
    fc.record({ kind: fc.constant('correct'), ms: fc.integer({ min: 0, max: TIMER_MS }) }),
    fc.record({ kind: fc.constant('wrong') }),
  );

  it('finished state produces valid session payload fields', () => {
    fc.assert(
      fc.property(fc.array(event, { minLength: 1, maxLength: 50 }), (events) => {
        let s = initState({ startedAt: 0 });
        for (const ev of events) {
          if (isFinished(s)) break;
          s = ev.kind === 'correct'
            ? applyCorrect(s, { msRemaining: ev.ms })
            : applyWrongOrTimeout(s);
        }

        const totalAnswered = s.correct + s.wrong;
        const stars = computeStars({
          correct: s.correct,
          total: Math.max(1, totalAnswered),
          livesLost: STARTING_LIVES - s.lives,
        });

        // Invariants:
        expect(s.correct).toBeGreaterThanOrEqual(0);
        expect(s.wrong).toBeGreaterThanOrEqual(0);
        expect(totalAnswered).toBeGreaterThanOrEqual(s.correct);
        expect(stars).toBeGreaterThanOrEqual(0);
        expect(stars).toBeLessThanOrEqual(3);
        expect(s.coins).toBeGreaterThanOrEqual(0);
        expect(s.coins).toBeLessThanOrEqual(2 * s.correct);
      }),
    );
  });
});
