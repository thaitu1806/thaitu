import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_QUESTIONS, GARMENTS_GOAL, PANELS_PER_GARMENT,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v57/game-logic.js';

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

describe('V57 P1 — bounds', () => {
  it('0 ≤ panels < PANELS_PER_GARMENT, 0 ≤ garments ≤ goal', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
      const { trace } = run(events);
      for (const s of trace) {
        expect(s.panels).toBeGreaterThanOrEqual(0);
        expect(s.panels).toBeLessThan(PANELS_PER_GARMENT);
        expect(s.garments.length).toBeLessThanOrEqual(GARMENTS_GOAL);
      }
    }));
  });
});

describe('V57 P2 — wrong resets streak and panels', () => {
  it('wrong → streak=0 and panels=0', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
      const { trace } = run(events);
      for (let i = 1; i < trace.length; i++) {
        if (trace[i - 1].outcome !== 'sewing') continue;
        if (trace[i].wrong > trace[i - 1].wrong) {
          expect(trace[i].streak).toBe(0);
          expect(trace[i].panels).toBe(0);
        }
      }
    }));
  });
});

describe('V57 P3 — monotonic', () => {
  it('garments never shrinks', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
      const { trace } = run(events);
      for (let i = 1; i < trace.length; i++) {
        expect(trace[i].garments.length).toBeGreaterThanOrEqual(trace[i - 1].garments.length);
      }
    }));
  });
});

describe('V57 P4 — termination', () => {
  it('outcome ∈ {sewing, won, closed}', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
      const { final } = run(events);
      expect(['sewing', 'won', 'closed']).toContain(final.outcome);
    }));
  });
});
