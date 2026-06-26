import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_QUESTIONS, CYCLES_GOAL, STAGES_PER_CYCLE,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v58/game-logic.js';

const eventArb = fc.oneof(
  fc.constant({ kind: 'correct' }),
  fc.constant({ kind: 'wrong' }),
);

function run(events) {
  let s = initState({ startedAt: 0 });
  const trace = [s];
  for (const ev of events) {
    if (isFinished(s)) break;
    s = ev.kind === 'correct' ? applyCorrect(s) : applyWrongOrTimeout(s);
    trace.push(s);
  }
  return { final: s, trace };
}

describe('V58 P1 — bounds', () => {
  it('0 ≤ stage < STAGES_PER_CYCLE, 0 ≤ cycles ≤ goal', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
      const { trace } = run(events);
      for (const s of trace) {
        expect(s.stage).toBeGreaterThanOrEqual(0);
        expect(s.stage).toBeLessThan(STAGES_PER_CYCLE);
        expect(s.cycles).toBeLessThanOrEqual(CYCLES_GOAL);
      }
    }));
  });
});

describe('V58 P2 — wrong resets streak', () => {
  it('after wrong, streak = 0', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
      const { trace } = run(events);
      for (let i = 1; i < trace.length; i++) {
        if (trace[i - 1].outcome !== 'farming') continue;
        if (trace[i].wrong > trace[i - 1].wrong) expect(trace[i].streak).toBe(0);
      }
    }));
  });
});

describe('V58 P3 — monotonic', () => {
  it('cycles, bushels never decrease', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
      const { trace } = run(events);
      for (let i = 1; i < trace.length; i++) {
        expect(trace[i].cycles).toBeGreaterThanOrEqual(trace[i - 1].cycles);
        expect(trace[i].bushels).toBeGreaterThanOrEqual(trace[i - 1].bushels);
      }
    }));
  });
});

describe('V58 P4 — termination', () => {
  it('outcome ∈ {farming, won, closed}', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
      const { final } = run(events);
      expect(['farming', 'won', 'closed']).toContain(final.outcome);
    }));
  });
});
