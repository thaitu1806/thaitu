import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_QUESTIONS, SNOWMEN_GOAL, PIECES_PER_SNOWMAN,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v56/game-logic.js';

const eventArb = fc.oneof(
  fc.record({ kind: fc.constant('correct'), r: fc.double({ min: 0, max: 0.999 }) }),
  fc.record({ kind: fc.constant('wrong') }),
);

function run(events) {
  let s = initState({ startedAt: 0 });
  const trace = [s];
  for (const ev of events) {
    if (isFinished(s)) break;
    s = ev.kind === 'correct' ? applyCorrect(s, { rng: () => ev.r }) : applyWrongOrTimeout(s);
    trace.push(s);
  }
  return { final: s, trace };
}

describe('V56 P1 — bounds', () => {
  it('0 ≤ currentPieces < PIECES_PER_SNOWMAN, 0 ≤ snowmen ≤ goal', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
      const { trace } = run(events);
      for (const s of trace) {
        expect(s.currentPieces).toBeGreaterThanOrEqual(0);
        expect(s.currentPieces).toBeLessThan(PIECES_PER_SNOWMAN);
        expect(s.snowmen.length).toBeLessThanOrEqual(SNOWMEN_GOAL);
      }
    }));
  });
});

describe('V56 P2 — wrong resets streak', () => {
  it('streak goes to 0 on wrong', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
      const { trace } = run(events);
      for (let i = 1; i < trace.length; i++) {
        if (trace[i - 1].outcome !== 'building') continue;
        if (trace[i].wrong > trace[i - 1].wrong) expect(trace[i].streak).toBe(0);
      }
    }));
  });
});

describe('V56 P3 — monotonic', () => {
  it('snowmen never shrinks', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
      const { trace } = run(events);
      for (let i = 1; i < trace.length; i++) {
        expect(trace[i].snowmen.length).toBeGreaterThanOrEqual(trace[i - 1].snowmen.length);
      }
    }));
  });
});

describe('V56 P4 — termination', () => {
  it('outcome ∈ {building, won, closed}', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
      const { final } = run(events);
      expect(['building', 'won', 'closed']).toContain(final.outcome);
    }));
  });
});
