import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  TOTAL_POTS, MAX_QUESTIONS, MAX_STAGE,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v46/game-logic.js';

const eventArb = fc.oneof(
  fc.record({ kind: fc.constant('correct') }),
  fc.record({ kind: fc.constant('wrong') }),
);

function runEvents(events) {
  let s = initState({ rng: () => 0.5, startedAt: 0 });
  const trace = [s];
  for (const ev of events) {
    if (isFinished(s)) break;
    s = ev.kind === 'correct' ? applyCorrect(s) : applyWrongOrTimeout(s);
    trace.push(s);
  }
  return { final: s, trace };
}

describe('V46 P1 — growth bounds', () => {
  it('every pot stage ∈ [0, MAX_STAGE]', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 60 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          for (const p of s.pots) {
            expect(p.stage).toBeGreaterThanOrEqual(0);
            expect(p.stage).toBeLessThanOrEqual(MAX_STAGE);
          }
        }
      }),
    );
  });
});

describe('V46 P2 — correct grows exactly one stage', () => {
  it('total stage sum grows by exactly 1 (or 0 if all full)', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 40 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          const before = trace[i - 1];
          const after = trace[i];
          if (before.outcome !== 'tending') continue;
          if (before.correct === after.correct) continue;
          const beforeSum = before.pots.reduce((a, p) => a + p.stage, 0);
          const afterSum = after.pots.reduce((a, p) => a + p.stage, 0);
          const allFull = before.pots.every((p) => p.stage === MAX_STAGE);
          if (allFull) expect(afterSum - beforeSum).toBe(0);
          else expect(afterSum - beforeSum).toBe(1);
        }
      }),
    );
  });
});

describe('V46 P3 — wrong leaves stages unchanged', () => {
  it('stages array equal before/after wrong event', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 40 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          const before = trace[i - 1];
          const after = trace[i];
          if (before.outcome !== 'tending') continue;
          if (after.wrong === before.wrong) continue;
          expect(after.pots.map((p) => p.stage)).toEqual(before.pots.map((p) => p.stage));
        }
      }),
    );
  });
});

describe('V46 P4 — collectedCount invariant', () => {
  it('collectedCount equals number of pots at MAX_STAGE', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 60 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          const full = s.pots.filter((p) => p.stage === MAX_STAGE).length;
          expect(s.collectedCount).toBe(full);
        }
      }),
    );
  });
});

describe('V46 P5 — win predicate', () => {
  it('outcome=won iff collectedCount===totalPots', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 80 }), (events) => {
        const { final } = runEvents(events);
        if (final.outcome === 'won') expect(final.collectedCount).toBe(final.totalPots);
        if (final.collectedCount === final.totalPots && final.outcome !== 'tending') {
          expect(final.outcome).toBe('won');
        }
      }),
    );
  });
});

describe('V46 P6 — closed predicate', () => {
  it('outcome=closed iff budget exhausted and not won', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 60 }), (events) => {
        const { final } = runEvents(events);
        if (final.outcome === 'closed') {
          expect(final.questionsServed).toBeGreaterThanOrEqual(MAX_QUESTIONS);
          expect(final.collectedCount).toBeLessThan(final.totalPots);
        }
      }),
    );
  });
});

describe('V46 P7 — session validity', () => {
  it('total ≥ correct ≥ 0', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 60 }), (events) => {
        const { final } = runEvents(events);
        expect(final.correct + final.wrong).toBeGreaterThanOrEqual(final.correct);
        expect(final.correct).toBeGreaterThanOrEqual(0);
      }),
    );
  });
});
