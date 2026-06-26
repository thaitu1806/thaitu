import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_QUESTIONS, GOALS_TO_WIN, GOALS_TO_LOSE,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v55/game-logic.js';

const eventArb = fc.oneof(
  fc.record({ kind: fc.constant('correct'), r: fc.double({ min: 0, max: 0.999 }) }),
  fc.record({ kind: fc.constant('wrong'),   r: fc.double({ min: 0, max: 0.999 }) }),
);

function runEvents(events) {
  let s = initState({ startedAt: 0 });
  const trace = [s];
  for (const ev of events) {
    if (isFinished(s)) break;
    s = ev.kind === 'correct'
      ? applyCorrect(s, { rng: () => ev.r })
      : applyWrongOrTimeout(s, { rng: () => ev.r });
    trace.push(s);
  }
  return { final: s, trace };
}

describe('V55 P1 — goals bounded', () => {
  it('0 ≤ myGoals ≤ GOALS_TO_WIN, 0 ≤ oppGoals ≤ GOALS_TO_LOSE', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 10 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.myGoals).toBeGreaterThanOrEqual(0);
          expect(s.myGoals).toBeLessThanOrEqual(GOALS_TO_WIN);
          expect(s.oppGoals).toBeGreaterThanOrEqual(0);
          expect(s.oppGoals).toBeLessThanOrEqual(GOALS_TO_LOSE);
        }
      }),
    );
  });
});

describe('V55 P2 — wrong resets streak', () => {
  it('after a wrong event, streak === 0', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          if (trace[i - 1].outcome !== 'playing') continue;
          if (trace[i].wrong > trace[i - 1].wrong) {
            expect(trace[i].streak).toBe(0);
          }
        }
      }),
    );
  });
});

describe('V55 P3 — shots ≤ correct', () => {
  it('shots count cannot exceed correct count', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { final } = runEvents(events);
        expect(final.shots).toBe(final.correct);
        expect(final.myGoals).toBeLessThanOrEqual(final.shots);
      }),
    );
  });
});

describe('V55 P4 — monotonic', () => {
  it('correct, wrong, questionsServed, myGoals, oppGoals never decrease', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          expect(trace[i].correct).toBeGreaterThanOrEqual(trace[i - 1].correct);
          expect(trace[i].wrong).toBeGreaterThanOrEqual(trace[i - 1].wrong);
          expect(trace[i].questionsServed).toBeGreaterThanOrEqual(trace[i - 1].questionsServed);
          expect(trace[i].myGoals).toBeGreaterThanOrEqual(trace[i - 1].myGoals);
          expect(trace[i].oppGoals).toBeGreaterThanOrEqual(trace[i - 1].oppGoals);
        }
      }),
    );
  });
});

describe('V55 P5 — termination', () => {
  it('outcome ∈ {playing, won, lost, closed}', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        expect(['playing', 'won', 'lost', 'closed']).toContain(final.outcome);
      }),
    );
  });
});

describe('V55 P6 — session validity', () => {
  it('total ≥ correct ≥ 0', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { final } = runEvents(events);
        expect(final.correct + final.wrong).toBeGreaterThanOrEqual(final.correct);
        expect(final.correct).toBeGreaterThanOrEqual(0);
      }),
    );
  });
});
