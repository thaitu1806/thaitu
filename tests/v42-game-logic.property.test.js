// Property-based tests for V42 (Hot-Air Balloon) pure logic.
// Validates P1–P8 from .kiro/specs/v42-hot-air-balloon/requirements.md
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_ALTITUDE,
  MAX_QUESTIONS,
  TIMER_SECONDS,
  BASE_GAIN,
  initState,
  applyCorrect,
  applyWrongOrTimeout,
  isFinished,
  BADGES,
} from '../public/v42/game-logic.js';

const TIMER_MS = TIMER_SECONDS * 1000;

const playingState = fc
  .record({
    altitude: fc.integer({ min: 0, max: MAX_ALTITUDE - 1 }),
    correct: fc.integer({ min: 0, max: 50 }),
    wrong: fc.integer({ min: 0, max: 50 }),
    questionsServed: fc.integer({ min: 0, max: MAX_QUESTIONS - 1 }),
  })
  .map((s) => ({
    ...s,
    maxAltitude: MAX_ALTITUDE,
    maxQuestions: MAX_QUESTIONS,
    badges: BADGES.filter((b) => s.altitude >= b.threshold).map((b) => b.id),
    outcome: 'playing',
    startedAt: 0,
  }));

const eventArb = fc.oneof(
  fc.record({ kind: fc.constant('correct'), ms: fc.integer({ min: 0, max: TIMER_MS }) }),
  fc.record({ kind: fc.constant('wrong') }),
);

function runEvents(events) {
  let s = initState({ startedAt: 0 });
  const trace = [s];
  for (const ev of events) {
    if (isFinished(s)) break;
    s = ev.kind === 'correct'
      ? applyCorrect(s, { msRemaining: ev.ms })
      : applyWrongOrTimeout(s);
    trace.push(s);
  }
  return { final: s, trace };
}

describe('V42 P1 — altitude bounds', () => {
  it('every state satisfies 0 ≤ altitude ≤ maxAltitude', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.altitude).toBeGreaterThanOrEqual(0);
          expect(s.altitude).toBeLessThanOrEqual(MAX_ALTITUDE);
        }
      }),
    );
  });
});

describe('V42 P2 — correct never decreases altitude', () => {
  it('correct event yields altitude ≥ prev', () => {
    fc.assert(
      fc.property(
        playingState,
        fc.integer({ min: 0, max: TIMER_MS }),
        (s, ms) => {
          const n = applyCorrect(s, { msRemaining: ms });
          expect(n.altitude).toBeGreaterThanOrEqual(s.altitude);
        },
      ),
    );
  });

  it('correct strictly increases altitude unless already at max', () => {
    fc.assert(
      fc.property(playingState, fc.integer({ min: 0, max: TIMER_MS }), (s, ms) => {
        const n = applyCorrect(s, { msRemaining: ms });
        if (s.altitude < MAX_ALTITUDE) {
          expect(n.altitude).toBeGreaterThan(s.altitude);
        }
      }),
    );
  });
});

describe('V42 P3 — wrong/timeout never increases altitude', () => {
  it('wrong event yields altitude ≤ prev', () => {
    fc.assert(
      fc.property(playingState, (s) => {
        const n = applyWrongOrTimeout(s);
        expect(n.altitude).toBeLessThanOrEqual(s.altitude);
      }),
    );
  });

  it('wrong strictly decreases altitude unless already at 0', () => {
    fc.assert(
      fc.property(playingState, (s) => {
        const n = applyWrongOrTimeout(s);
        if (s.altitude > 0) {
          expect(n.altitude).toBeLessThan(s.altitude);
        } else {
          expect(n.altitude).toBe(0);
        }
      }),
    );
  });
});

describe('V42 P4 — bonus mapping {10, 12, 15} or clamped', () => {
  it('altitude delta on correct ∈ {10,12,15} unless capped at maxAltitude', () => {
    fc.assert(
      fc.property(playingState, fc.integer({ min: 0, max: TIMER_MS }), (s, ms) => {
        const n = applyCorrect(s, { msRemaining: ms });
        const delta = n.altitude - s.altitude;
        const cappedAt = n.altitude === MAX_ALTITUDE;
        const expectedDeltas = new Set([10, 12, 15]);
        if (!cappedAt) {
          expect(expectedDeltas.has(delta)).toBe(true);
        } else {
          // When capped, the raw gain (10/12/15) must have been at least delta.
          expect(delta).toBeGreaterThanOrEqual(0);
          expect(delta).toBeLessThanOrEqual(15);
        }
      }),
    );
  });
});

describe('V42 P5 — outcome won iff altitude reaches max', () => {
  it('any sequence ending at altitude 100 has outcome=won', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 40 }), (events) => {
        const { final } = runEvents(events);
        if (final.altitude === MAX_ALTITUDE) {
          expect(final.outcome).toBe('won');
        }
        if (final.outcome === 'won') {
          expect(final.altitude).toBe(MAX_ALTITUDE);
        }
      }),
    );
  });
});

describe('V42 P6 — question budget triggers try-again', () => {
  it('exhausting MAX_QUESTIONS without winning ends with try-again', () => {
    // Force all wrongs so we never win.
    const events = Array.from({ length: MAX_QUESTIONS }, () => ({ kind: 'wrong' }));
    const { final } = runEvents(events);
    expect(final.questionsServed).toBe(MAX_QUESTIONS);
    expect(final.altitude).toBeLessThan(MAX_ALTITUDE);
    expect(final.outcome).toBe('try-again');
  });

  it('finished states are sticky (no further mutation)', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { minLength: MAX_QUESTIONS, maxLength: 40 }), (events) => {
        const { final } = runEvents(events);
        if (isFinished(final)) {
          expect(applyCorrect(final, { msRemaining: TIMER_MS })).toEqual(final);
          expect(applyWrongOrTimeout(final)).toEqual(final);
        }
      }),
    );
  });
});

describe('V42 P7 — badge monotonicity', () => {
  it('badge set only grows along a run', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          const prev = new Set(trace[i - 1].badges);
          for (const id of prev) {
            expect(trace[i].badges).toContain(id);
          }
        }
      }),
    );
  });
});

describe('V42 P8 — session payload validity', () => {
  it('finished state yields valid payload-ready fields', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { minLength: 1, maxLength: 30 }), (events) => {
        const { final } = runEvents(events);
        const totalAnswered = final.correct + final.wrong;
        expect(totalAnswered).toBe(final.questionsServed);
        expect(totalAnswered).toBeGreaterThanOrEqual(final.correct);
        expect(final.correct).toBeGreaterThanOrEqual(0);
        expect(final.altitude).toBeGreaterThanOrEqual(0);
        expect(final.altitude).toBeLessThanOrEqual(MAX_ALTITUDE);
        expect(final.badges.length).toBeGreaterThanOrEqual(0);
        expect(final.badges.length).toBeLessThanOrEqual(3);
      }),
    );
  });
});
