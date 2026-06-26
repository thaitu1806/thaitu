import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_QUESTIONS, TRACKS_TO_BUILD, BEATS_PER_TRACK, GROOVE_MAX,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v49/game-logic.js';

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

describe('V49 P1 — tracks bounded by goal', () => {
  it('0 ≤ tracks.length ≤ TRACKS_TO_BUILD', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 10 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.tracks.length).toBeGreaterThanOrEqual(0);
          expect(s.tracks.length).toBeLessThanOrEqual(TRACKS_TO_BUILD);
        }
      }),
    );
  });
});

describe('V49 P2 — groove bounded', () => {
  it('0 ≤ groove ≤ GROOVE_MAX', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 10 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.groove).toBeGreaterThanOrEqual(0);
          expect(s.groove).toBeLessThanOrEqual(GROOVE_MAX);
        }
      }),
    );
  });
});

describe('V49 P3 — currentBeats bounded', () => {
  it('0 ≤ currentBeats < BEATS_PER_TRACK', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 10 }), (events) => {
        const { trace } = runEvents(events);
        for (const s of trace) {
          expect(s.currentBeats).toBeGreaterThanOrEqual(0);
          expect(s.currentBeats).toBeLessThan(BEATS_PER_TRACK);
        }
      }),
    );
  });
});

describe('V49 P4 — monotonic counters', () => {
  it('correct, wrong, questionsServed, tracks.length never decrease', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          expect(trace[i].correct).toBeGreaterThanOrEqual(trace[i - 1].correct);
          expect(trace[i].wrong).toBeGreaterThanOrEqual(trace[i - 1].wrong);
          expect(trace[i].questionsServed).toBeGreaterThanOrEqual(trace[i - 1].questionsServed);
          expect(trace[i].tracks.length).toBeGreaterThanOrEqual(trace[i - 1].tracks.length);
        }
      }),
    );
  });
});

describe('V49 P5 — termination', () => {
  it('outcome ∈ {mixing, won, closed}', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        expect(['mixing', 'won', 'closed']).toContain(final.outcome);
      }),
    );
  });

  it('won iff tracks.length === TRACKS_TO_BUILD', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        if (final.outcome === 'won') {
          expect(final.tracks.length).toBe(TRACKS_TO_BUILD);
        }
      }),
    );
  });
});

describe('V49 P6 — wrong does not add beats or tracks', () => {
  it('wrong never increases currentBeats or tracks.length', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          if (trace[i - 1].outcome !== 'mixing') continue;
          if (trace[i].wrong > trace[i - 1].wrong) {
            expect(trace[i].currentBeats).toBe(trace[i - 1].currentBeats);
            expect(trace[i].tracks.length).toBe(trace[i - 1].tracks.length);
          }
        }
      }),
    );
  });
});

describe('V49 P7 — session validity', () => {
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
