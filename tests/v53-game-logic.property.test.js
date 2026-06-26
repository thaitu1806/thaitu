import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_QUESTIONS, FLOORS, ALARMS_MAX,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v53/game-logic.js';

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

describe('V53 P1 — bounds', () => {
  it('0 ≤ floor ≤ FLOORS, 0 ≤ alarms ≤ ALARMS_MAX', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 10 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.floor).toBeGreaterThanOrEqual(0);
          expect(s.floor).toBeLessThanOrEqual(FLOORS);
          expect(s.alarms).toBeGreaterThanOrEqual(0);
          expect(s.alarms).toBeLessThanOrEqual(ALARMS_MAX);
        }
      }),
    );
  });
});

describe('V53 P2 — wrong increments alarms', () => {
  it('every wrong event raises alarms by 1', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          if (trace[i - 1].outcome !== 'sneaking') continue;
          if (trace[i].wrong > trace[i - 1].wrong) {
            expect(trace[i].alarms).toBe(trace[i - 1].alarms + 1);
            expect(trace[i].streak).toBe(0);
          }
        }
      }),
    );
  });
});

describe('V53 P3 — monotonic', () => {
  it('correct, wrong, questionsServed, floor, intel.length never decrease', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          expect(trace[i].correct).toBeGreaterThanOrEqual(trace[i - 1].correct);
          expect(trace[i].wrong).toBeGreaterThanOrEqual(trace[i - 1].wrong);
          expect(trace[i].questionsServed).toBeGreaterThanOrEqual(trace[i - 1].questionsServed);
          expect(trace[i].floor).toBeGreaterThanOrEqual(trace[i - 1].floor);
          expect(trace[i].intel.length).toBeGreaterThanOrEqual(trace[i - 1].intel.length);
        }
      }),
    );
  });
});

describe('V53 P4 — termination', () => {
  it('outcome ∈ {sneaking, won, caught, closed}', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        expect(['sneaking', 'won', 'caught', 'closed']).toContain(final.outcome);
      }),
    );
  });

  it('won implies floor === FLOORS', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        if (final.outcome === 'won') expect(final.floor).toBe(FLOORS);
      }),
    );
  });

  it('caught implies alarms === ALARMS_MAX', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        if (final.outcome === 'caught') expect(final.alarms).toBe(ALARMS_MAX);
      }),
    );
  });
});

describe('V53 P5 — session validity', () => {
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
