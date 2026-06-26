import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_QUESTIONS, TOTAL_SPECIES, BASE_CATCH_RATE, BOOST_CATCH_RATE,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v51/game-logic.js';

const eventArb = fc.oneof(
  fc.record({ kind: fc.constant('correct'), r1: fc.double({ min: 0, max: 0.999 }), r2: fc.double({ min: 0, max: 0.999 }) }),
  fc.record({ kind: fc.constant('wrong') }),
);

function runEvents(events) {
  let s = initState({ startedAt: 0 });
  const trace = [s];
  for (const ev of events) {
    if (isFinished(s)) break;
    if (ev.kind === 'correct') {
      const rolls = [ev.r1, ev.r2];
      let i = 0;
      s = applyCorrect(s, { rng: () => rolls[i++ % rolls.length] });
    } else {
      s = applyWrongOrTimeout(s);
    }
    trace.push(s);
  }
  return { final: s, trace };
}

describe('V51 P1 — captured count bounded', () => {
  it('0 ≤ captured.length ≤ TOTAL_SPECIES, unique', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 10 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.captured.length).toBeGreaterThanOrEqual(0);
          expect(s.captured.length).toBeLessThanOrEqual(TOTAL_SPECIES);
          expect(new Set(s.captured).size).toBe(s.captured.length);
        }
      }),
    );
  });
});

describe('V51 P2 — wrong resets streak', () => {
  it('after a wrong event, streak === 0', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          if (trace[i - 1].outcome !== 'hunting') continue;
          if (trace[i].wrong > trace[i - 1].wrong) {
            expect(trace[i].streak).toBe(0);
          }
        }
      }),
    );
  });
});

describe('V51 P3 — catches ≤ correct attempts', () => {
  it('catches never exceeds correct count', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.catches).toBeLessThanOrEqual(s.correct);
        }
      }),
    );
  });
});

describe('V51 P4 — catches === captured.length', () => {
  it('every catch adds a unique species to captured', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { final } = runEvents(events);
        // captures may exceed captured.length only if the wild list ran out (no target),
        // but our logic returns target=null in that case and skips the catch.
        // So they should always match.
        expect(final.catches).toBe(final.captured.length);
      }),
    );
  });
});

describe('V51 P5 — monotonic counters', () => {
  it('correct, wrong, attempts, captured.length never decrease', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          expect(trace[i].correct).toBeGreaterThanOrEqual(trace[i - 1].correct);
          expect(trace[i].wrong).toBeGreaterThanOrEqual(trace[i - 1].wrong);
          expect(trace[i].attempts).toBeGreaterThanOrEqual(trace[i - 1].attempts);
          expect(trace[i].captured.length).toBeGreaterThanOrEqual(trace[i - 1].captured.length);
        }
      }),
    );
  });
});

describe('V51 P6 — termination', () => {
  it('outcome ∈ {hunting, won, closed}', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        expect(['hunting', 'won', 'closed']).toContain(final.outcome);
      }),
    );
  });
});

describe('V51 P7 — session validity', () => {
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
