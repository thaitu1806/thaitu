import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_QUESTIONS, MAX_DEPTH, OXYGEN_START, TREASURE_COMBO,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v50/game-logic.js';

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

describe('V50 P1 — depth bounded', () => {
  it('0 ≤ depth ≤ MAX_DEPTH', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 10 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.depth).toBeGreaterThanOrEqual(0);
          expect(s.depth).toBeLessThanOrEqual(MAX_DEPTH);
        }
      }),
    );
  });
});

describe('V50 P2 — oxygen bounded', () => {
  it('0 ≤ oxygen ≤ OXYGEN_START', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 10 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.oxygen).toBeGreaterThanOrEqual(0);
          expect(s.oxygen).toBeLessThanOrEqual(OXYGEN_START);
        }
      }),
    );
  });
});

describe('V50 P3 — wrong resets combo', () => {
  it('after a wrong event, comboRun becomes 0', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          if (trace[i - 1].outcome !== 'diving') continue;
          if (trace[i].wrong > trace[i - 1].wrong) {
            expect(trace[i].comboRun).toBe(0);
          }
        }
      }),
    );
  });
});

describe('V50 P4 — treasures only on correct streak', () => {
  it('every treasure addition coincides with a correct event', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          if (trace[i].treasures.length > trace[i - 1].treasures.length) {
            expect(trace[i].correct).toBe(trace[i - 1].correct + 1);
          }
        }
      }),
    );
  });
});

describe('V50 P5 — monotonic counters', () => {
  it('correct, wrong, questionsServed, depth, treasures.length never decrease', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          expect(trace[i].correct).toBeGreaterThanOrEqual(trace[i - 1].correct);
          expect(trace[i].wrong).toBeGreaterThanOrEqual(trace[i - 1].wrong);
          expect(trace[i].questionsServed).toBeGreaterThanOrEqual(trace[i - 1].questionsServed);
          expect(trace[i].depth).toBeGreaterThanOrEqual(trace[i - 1].depth);
          expect(trace[i].treasures.length).toBeGreaterThanOrEqual(trace[i - 1].treasures.length);
        }
      }),
    );
  });
});

describe('V50 P6 — termination', () => {
  it('outcome ∈ {diving, won, surfaced, closed}', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        expect(['diving', 'won', 'surfaced', 'closed']).toContain(final.outcome);
      }),
    );
  });

  it('won iff depth === MAX_DEPTH', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        if (final.outcome === 'won') expect(final.depth).toBe(MAX_DEPTH);
      }),
    );
  });

  it('surfaced implies oxygen === 0 and depth < MAX_DEPTH', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        if (final.outcome === 'surfaced') {
          expect(final.oxygen).toBe(0);
          expect(final.depth).toBeLessThan(MAX_DEPTH);
        }
      }),
    );
  });
});

describe('V50 P7 — session validity', () => {
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
