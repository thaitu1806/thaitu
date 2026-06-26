import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_QUESTIONS, TOTAL_DINOS, DANGER_MAX, COMBO_BONUS,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v48/game-logic.js';

const eventArb = fc.oneof(
  fc.constant({ kind: 'correct' }),
  fc.constant({ kind: 'wrong' }),
);

function runEvents(events) {
  let s = initState({ startedAt: 0 });
  const trace = [s];
  for (const ev of events) {
    if (isFinished(s)) break;
    s = ev.kind === 'correct' ? applyCorrect(s) : applyWrongOrTimeout(s);
    trace.push(s);
  }
  return { final: s, trace };
}

describe('V48 P1 — rescuedCount bounded', () => {
  it('0 ≤ rescuedCount ≤ TOTAL_DINOS', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 10 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.rescuedCount).toBeGreaterThanOrEqual(0);
          expect(s.rescuedCount).toBeLessThanOrEqual(TOTAL_DINOS);
        }
      }),
    );
  });
});

describe('V48 P2 — danger bounded', () => {
  it('0 ≤ danger ≤ DANGER_MAX', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 10 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.danger).toBeGreaterThanOrEqual(0);
          expect(s.danger).toBeLessThanOrEqual(DANGER_MAX);
        }
      }),
    );
  });
});

describe('V48 P3 — wrong resets combo', () => {
  it('after a wrong event, comboRun becomes 0', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          if (trace[i - 1].outcome !== 'rescuing') continue;
          if (trace[i].wrong > trace[i - 1].wrong) {
            expect(trace[i].comboRun).toBe(0);
          }
        }
      }),
    );
  });
});

describe('V48 P4 — combo bonus triggers every COMBO_BONUS streak', () => {
  it('a streak of N correct rescues at least N dinos (mod the cap)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 6 }), (streak) => {
        let s = initState({ startedAt: 0 });
        for (let i = 0; i < streak && s.outcome === 'rescuing'; i++) s = applyCorrect(s);
        const expected = Math.min(TOTAL_DINOS, streak + Math.floor(streak / COMBO_BONUS));
        expect(s.rescuedCount).toBe(expected);
      }),
    );
  });
});

describe('V48 P5 — monotonic counters', () => {
  it('correct, wrong, questionsServed never decrease', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          expect(trace[i].correct).toBeGreaterThanOrEqual(trace[i - 1].correct);
          expect(trace[i].wrong).toBeGreaterThanOrEqual(trace[i - 1].wrong);
          expect(trace[i].questionsServed).toBeGreaterThanOrEqual(trace[i - 1].questionsServed);
        }
      }),
    );
  });
});

describe('V48 P6 — termination', () => {
  it('outcome ∈ {rescuing, won, erupted, closed}', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        expect(['rescuing', 'won', 'erupted', 'closed']).toContain(final.outcome);
      }),
    );
  });

  it('won iff rescuedCount === TOTAL_DINOS', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        if (final.outcome === 'won') {
          expect(final.rescuedCount).toBe(TOTAL_DINOS);
        }
      }),
    );
  });

  it('erupted implies danger === DANGER_MAX and not all rescued', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        if (final.outcome === 'erupted') {
          expect(final.danger).toBe(DANGER_MAX);
          expect(final.rescuedCount).toBeLessThan(TOTAL_DINOS);
        }
      }),
    );
  });
});

describe('V48 P7 — session validity', () => {
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
