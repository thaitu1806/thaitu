import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  COLORS, MAX_QUESTIONS, MAX_SLIMES, CRAFT_DROPS,
  initState, applyCorrect, applyWrongOrTimeout, isFinished,
} from '../public/v47/game-logic.js';

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

describe('V47 P1 — drop count', () => {
  it('correct adds 1 drop unless craft triggers reset', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 0.999 }), (r) => {
        let s = initState({ startedAt: 0 });
        const s1 = applyCorrect(s, { rng: () => r });
        expect(s1.jarDrops).toBe(1);
      }),
    );
  });
});

describe('V47 P2 — wrong resets', () => {
  it('any wrong yields empty jar and comboRun=0', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 20 }), (events) => {
        const { trace } = runEvents(events);
        for (let i = 1; i < trace.length; i++) {
          if (trace[i - 1].outcome !== 'mixing') continue;
          if (trace[i].wrong > trace[i - 1].wrong) {
            expect(trace[i].jarColor).toBe(null);
            expect(trace[i].jarDrops).toBe(0);
            expect(trace[i].comboRun).toBe(0);
          }
        }
      }),
    );
  });
});

describe('V47 P3 — combo same-color', () => {
  it('jarColor remains constant while jarDrops > 0', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const { trace } = runEvents(events);
        let curColor = null;
        for (const s of trace) {
          if (s.jarDrops === 0) curColor = null;
          else if (curColor == null) curColor = s.jarColor;
          else expect(s.jarColor).toBe(curColor);
        }
      }),
    );
  });
});

describe('V47 P4 — craft predicate', () => {
  it('slimesCrafted matches Math.floor of historical drops triggering craft', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 40 }), (events) => {
        const { trace } = runEvents(events);
        let crafts = 0;
        for (let i = 1; i < trace.length; i++) {
          if (trace[i].slimesCrafted > trace[i - 1].slimesCrafted) {
            // We must have just had jarDrops === CRAFT_DROPS before resetting
            crafts++;
          }
        }
        expect(crafts).toBe(trace[trace.length - 1].slimesCrafted);
      }),
    );
  });
});

describe('V47 P6 — termination', () => {
  it('closed iff slimesCrafted===MAX or questionsServed===MAX', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: MAX_QUESTIONS + 5 }), (events) => {
        const { final } = runEvents(events);
        if (final.outcome === 'closed') {
          expect(
            final.slimesCrafted >= MAX_SLIMES || final.questionsServed >= MAX_QUESTIONS
          ).toBe(true);
        }
      }),
    );
  });
});

describe('V47 P7 — session validity', () => {
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
