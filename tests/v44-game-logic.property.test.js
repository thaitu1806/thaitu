// Property-based tests for V44 (Shark Galaxy) pure logic.
// P1–P7 from .kiro/specs/v44-shark-galaxy/requirements.md
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  GOAL_DISTANCE,
  BOSS_THRESHOLD,
  MAX_BOSS_ATTEMPTS,
  RACE_GAIN,
  RACE_PENALTY,
  BOSS_GAIN,
  BOSS_PENALTY,
  initState,
  applyCorrect,
  applyWrongOrTimeout,
  isFinished,
  getPhase,
} from '../public/v44/game-logic.js';

const eventArb = fc.oneof(
  fc.record({ kind: fc.constant('correct') }),
  fc.record({ kind: fc.constant('wrong') }),
);

function runEvents(events) {
  let s = initState({ startedAt: 0 });
  const trace = [s];
  for (const ev of events) {
    if (isFinished(s)) break;
    s = ev.kind === 'correct' ? applyCorrect(s) : applyWrongOrTimeout(s);
    trace.push(s);
  }
  return { final: s, trace };
}

describe('V44 P1 — distance bounds', () => {
  it('0 ≤ distance ≤ goalDistance for every state', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 40 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.distance).toBeGreaterThanOrEqual(0);
          expect(s.distance).toBeLessThanOrEqual(GOAL_DISTANCE);
        }
      }),
    );
  });
});

describe('V44 P2 — correct never decreases distance', () => {
  it('applyCorrect yields distance ≥ prev', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 40 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          const prev = trace[i - 1];
          if (prev.outcome !== 'playing') continue;
          const next = applyCorrect(prev);
          expect(next.distance).toBeGreaterThanOrEqual(prev.distance);
        }
      }),
    );
  });
});

describe('V44 P3 — wrong never increases distance', () => {
  it('applyWrongOrTimeout yields distance ≤ prev', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 40 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          const prev = trace[i - 1];
          if (prev.outcome !== 'playing') continue;
          const next = applyWrongOrTimeout(prev);
          expect(next.distance).toBeLessThanOrEqual(prev.distance);
        }
      }),
    );
  });
});

describe('V44 P4 — phase predicate', () => {
  it('phase matches the distance bracket', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: GOAL_DISTANCE }), (d) => {
        const phase = getPhase(d);
        if (d >= BOSS_THRESHOLD && d < GOAL_DISTANCE) expect(phase).toBe('boss');
        else expect(phase).toBe('race');
      }),
    );
  });
});

describe('V44 P5 — outcome predicates', () => {
  it('won iff distance reaches goal', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 60 }), (events) => {
        const { final } = runEvents(events);
        if (final.outcome === 'won') expect(final.distance).toBe(GOAL_DISTANCE);
        if (final.distance === GOAL_DISTANCE && final.outcome !== 'playing') {
          expect(final.outcome).toBe('won');
        }
      }),
    );
  });

  it('lost only after MAX_BOSS_ATTEMPTS in boss bracket without winning', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 60 }), (events) => {
        const { final } = runEvents(events);
        if (final.outcome === 'lost') {
          expect(final.bossAttempts).toBeGreaterThanOrEqual(MAX_BOSS_ATTEMPTS);
          expect(final.distance).toBeLessThan(GOAL_DISTANCE);
        }
      }),
    );
  });
});

describe('V44 P6 — bossAttempts only increments in boss bracket', () => {
  it('attempts never increment when starting below threshold', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: BOSS_THRESHOLD - 1 }), (d) => {
        const s = { ...initState({ startedAt: 0 }), distance: d };
        expect(applyCorrect(s).bossAttempts).toBe(0);
        expect(applyWrongOrTimeout(s).bossAttempts).toBe(0);
      }),
    );
  });

  it('attempts increment by 1 per event when starting in boss bracket', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: BOSS_THRESHOLD, max: GOAL_DISTANCE - 1 }),
        fc.constant(0).chain(() => fc.boolean()),
        (d, isCorrect) => {
          const s = { ...initState({ startedAt: 0 }), distance: d };
          const next = isCorrect ? applyCorrect(s) : applyWrongOrTimeout(s);
          expect(next.bossAttempts).toBe(s.bossAttempts + 1);
        },
      ),
    );
  });
});

describe('V44 P7 — session payload validity', () => {
  it('any ended run yields valid totals', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 60 }), (events) => {
        const { final } = runEvents(events);
        const totalAnswered = final.correct + final.wrong;
        expect(totalAnswered).toBeGreaterThanOrEqual(final.correct);
        expect(final.correct).toBeGreaterThanOrEqual(0);
        expect(final.distance).toBeGreaterThanOrEqual(0);
        expect(final.distance).toBeLessThanOrEqual(GOAL_DISTANCE);
      }),
    );
  });
});
