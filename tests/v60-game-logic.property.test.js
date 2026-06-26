import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_QUESTIONS, STORIES_GOAL, CHAPTERS_PER_STORY,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v60/game-logic.js';

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

describe('V60 P1 — bounds', () => {
  it('0 ≤ chapters < CHAPTERS_PER_STORY, storiesDone ≤ goal', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
      const { trace } = run(events);
      for (const s of trace) {
        expect(s.chapters).toBeGreaterThanOrEqual(0);
        expect(s.chapters).toBeLessThan(CHAPTERS_PER_STORY);
        expect(s.storiesDone.length).toBeLessThanOrEqual(STORIES_GOAL);
      }
    }));
  });
});

describe('V60 P2 — wrong resets streak', () => {
  it('after wrong, streak = 0', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
      const { trace } = run(events);
      for (let i = 1; i < trace.length; i++) {
        if (trace[i - 1].outcome !== 'reading') continue;
        if (trace[i].wrong > trace[i - 1].wrong) expect(trace[i].streak).toBe(0);
      }
    }));
  });
});

describe('V60 P3 — monotonic', () => {
  it('storiesDone, morals never shrink', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
      const { trace } = run(events);
      for (let i = 1; i < trace.length; i++) {
        expect(trace[i].storiesDone.length).toBeGreaterThanOrEqual(trace[i - 1].storiesDone.length);
        expect(trace[i].morals.length).toBeGreaterThanOrEqual(trace[i - 1].morals.length);
      }
    }));
  });
});

describe('V60 P4 — termination', () => {
  it('outcome ∈ {reading, won, closed}', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
      const { final } = run(events);
      expect(['reading', 'won', 'closed']).toContain(final.outcome);
    }));
  });

  it('won → storiesDone.length === STORIES_GOAL', () => {
    fc.assert(fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
      const { final } = run(events);
      if (final.outcome === 'won') expect(final.storiesDone.length).toBe(STORIES_GOAL);
    }));
  });
});
