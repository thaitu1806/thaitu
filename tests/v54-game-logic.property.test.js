import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_QUESTIONS, POTIONS_GOAL, INGREDIENTS_PER_POTION,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v54/game-logic.js';

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

describe('V54 P1 — potions bounded by goal', () => {
  it('0 ≤ potions.length ≤ POTIONS_GOAL', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 10 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.potions.length).toBeGreaterThanOrEqual(0);
          expect(s.potions.length).toBeLessThanOrEqual(POTIONS_GOAL);
        }
      }),
    );
  });
});

describe('V54 P2 — cauldron bounded', () => {
  it('0 ≤ cauldron.count < INGREDIENTS_PER_POTION', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 10 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.cauldron.count).toBeGreaterThanOrEqual(0);
          expect(s.cauldron.count).toBeLessThan(INGREDIENTS_PER_POTION);
        }
      }),
    );
  });
});

describe('V54 P3 — wrong empties cauldron', () => {
  it('after wrong, cauldron.color = null and count = 0', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          if (trace[i - 1].outcome !== 'brewing') continue;
          if (trace[i].wrong > trace[i - 1].wrong) {
            expect(trace[i].cauldron.color).toBe(null);
            expect(trace[i].cauldron.count).toBe(0);
            expect(trace[i].streak).toBe(0);
          }
        }
      }),
    );
  });
});

describe('V54 P4 — monotonic', () => {
  it('correct, wrong, questionsServed, potions.length never decrease', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          expect(trace[i].correct).toBeGreaterThanOrEqual(trace[i - 1].correct);
          expect(trace[i].wrong).toBeGreaterThanOrEqual(trace[i - 1].wrong);
          expect(trace[i].questionsServed).toBeGreaterThanOrEqual(trace[i - 1].questionsServed);
          expect(trace[i].potions.length).toBeGreaterThanOrEqual(trace[i - 1].potions.length);
        }
      }),
    );
  });
});

describe('V54 P5 — termination', () => {
  it('outcome ∈ {brewing, won, closed}', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        expect(['brewing', 'won', 'closed']).toContain(final.outcome);
      }),
    );
  });
});

describe('V54 P6 — session validity', () => {
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
