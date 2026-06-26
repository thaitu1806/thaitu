import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_QUESTIONS, FINISH_LINE, STAMINA_MAX,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v59/game-logic.js';

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

describe('V59 P1 — bounds', () => {
  it('0 ≤ distance ≤ FINISH_LINE, 0 ≤ stamina ≤ STAMINA_MAX', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
      const { trace } = run(events);
      for (const s of trace) {
        expect(s.distance).toBeGreaterThanOrEqual(0);
        expect(s.distance).toBeLessThanOrEqual(FINISH_LINE);
        expect(s.stamina).toBeGreaterThanOrEqual(0);
        expect(s.stamina).toBeLessThanOrEqual(STAMINA_MAX);
      }
    }));
  });
});

describe('V59 P2 — wrong drops stamina', () => {
  it('wrong → stamina-- (until 0)', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
      const { trace } = run(events);
      for (let i = 1; i < trace.length; i++) {
        if (trace[i - 1].outcome !== 'racing') continue;
        if (trace[i].wrong > trace[i - 1].wrong) {
          expect(trace[i].stamina).toBeLessThanOrEqual(trace[i - 1].stamina);
        }
      }
    }));
  });
});

describe('V59 P3 — monotonic', () => {
  it('distance never decreases', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
      const { trace } = run(events);
      for (let i = 1; i < trace.length; i++) {
        expect(trace[i].distance).toBeGreaterThanOrEqual(trace[i - 1].distance);
      }
    }));
  });
});

describe('V59 P4 — termination', () => {
  it('outcome ∈ {racing, won, closed}', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
      const { final } = run(events);
      expect(['racing', 'won', 'closed']).toContain(final.outcome);
    }));
  });

  it('won → distance === FINISH_LINE', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
      const { final } = run(events);
      if (final.outcome === 'won') expect(final.distance).toBe(FINISH_LINE);
    }));
  });
});
