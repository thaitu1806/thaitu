import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_QUESTIONS, LANTERN_COUNT, WIN_THRESHOLD,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v52/game-logic.js';

const eventArb = fc.oneof(
  fc.record({ kind: fc.constant('correct'), r: fc.double({ min: 0, max: 0.999 }) }),
  fc.record({ kind: fc.constant('wrong') }),
);

function runEvents(events) {
  let s = initState({ startedAt: 0 });
  const trace = [s];
  for (const ev of events) {
    if (isFinished(s)) break;
    s = ev.kind === 'correct' ? applyCorrect(s, { rng: () => ev.r }) : applyWrongOrTimeout(s);
    trace.push(s);
  }
  return { final: s, trace };
}

describe('V52 P1 — litCount bounded', () => {
  it('0 ≤ litCount ≤ LANTERN_COUNT', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 10 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.litCount).toBeGreaterThanOrEqual(0);
          expect(s.litCount).toBeLessThanOrEqual(LANTERN_COUNT);
        }
      }),
    );
  });
});

describe('V52 P2 — wrong resets streak', () => {
  it('after a wrong event, streak === 0', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          if (trace[i - 1].outcome !== 'celebrating') continue;
          if (trace[i].wrong > trace[i - 1].wrong) {
            expect(trace[i].streak).toBe(0);
          }
        }
      }),
    );
  });
});

describe('V52 P3 — litCount = correct (capped)', () => {
  it('litCount equals min(correct, LANTERN_COUNT)', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.litCount).toBe(Math.min(s.correct, LANTERN_COUNT));
        }
      }),
    );
  });
});

describe('V52 P4 — monotonic', () => {
  it('correct, wrong, questionsServed, litCount never decrease', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          expect(trace[i].correct).toBeGreaterThanOrEqual(trace[i - 1].correct);
          expect(trace[i].wrong).toBeGreaterThanOrEqual(trace[i - 1].wrong);
          expect(trace[i].questionsServed).toBeGreaterThanOrEqual(trace[i - 1].questionsServed);
          expect(trace[i].litCount).toBeGreaterThanOrEqual(trace[i - 1].litCount);
        }
      }),
    );
  });
});

describe('V52 P5 — termination', () => {
  it('outcome ∈ {celebrating, won, closed}', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        expect(['celebrating', 'won', 'closed']).toContain(final.outcome);
      }),
    );
  });

  it('won implies litCount ≥ WIN_THRESHOLD', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        if (final.outcome === 'won') expect(final.litCount).toBeGreaterThanOrEqual(WIN_THRESHOLD);
      }),
    );
  });
});

describe('V52 P6 — session validity', () => {
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
