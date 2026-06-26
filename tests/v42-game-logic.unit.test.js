// Unit tests for V42 (Hot-Air Balloon) pure logic.
import { describe, it, expect } from 'vitest';
import {
  MAX_ALTITUDE,
  MAX_QUESTIONS,
  TIMER_SECONDS,
  BASE_GAIN,
  PENALTY,
  BADGES,
  initState,
  applyCorrect,
  applyWrongOrTimeout,
  isFinished,
  computeBonus,
  newBadgesEarned,
  pickNextQuestion,
} from '../public/v42/game-logic.js';

const TIMER_MS = TIMER_SECONDS * 1000;

describe('initState', () => {
  it('defaults to altitude 0, no badges, playing', () => {
    const s = initState({ startedAt: 0 });
    expect(s.altitude).toBe(0);
    expect(s.maxAltitude).toBe(MAX_ALTITUDE);
    expect(s.maxQuestions).toBe(MAX_QUESTIONS);
    expect(s.correct).toBe(0);
    expect(s.wrong).toBe(0);
    expect(s.questionsServed).toBe(0);
    expect(s.badges).toEqual([]);
    expect(s.outcome).toBe('playing');
  });

  it('honors overrides', () => {
    const s = initState({ maxAltitude: 50, maxQuestions: 6, startedAt: 1 });
    expect(s.maxAltitude).toBe(50);
    expect(s.maxQuestions).toBe(6);
  });
});

describe('computeBonus tiers', () => {
  it('msRemaining = full timer → 5', () => {
    expect(computeBonus(TIMER_MS, TIMER_MS)).toBe(5);
  });

  it('msRemaining just above 2/3 → 5', () => {
    expect(computeBonus(TIMER_MS * 0.67 + 1, TIMER_MS)).toBe(5);
  });

  it('msRemaining just below 2/3 → 2 (boundary is strict >)', () => {
    // 13333 < (2/3) * 20000 ≈ 13333.33 → tier "medium"
    expect(computeBonus(13333, TIMER_MS)).toBe(2);
  });

  it('msRemaining = half timer → 2', () => {
    expect(computeBonus(TIMER_MS / 2, TIMER_MS)).toBe(2);
  });

  it('msRemaining just below 1/3 → 0', () => {
    // 6666 < (1/3) * 20000 ≈ 6666.67 → tier "slow"
    expect(computeBonus(6666, TIMER_MS)).toBe(0);
  });

  it('msRemaining = 0 → 0', () => {
    expect(computeBonus(0, TIMER_MS)).toBe(0);
  });

  it('negative / NaN ms clamps to 0', () => {
    expect(computeBonus(-5, TIMER_MS)).toBe(0);
    expect(computeBonus(NaN, TIMER_MS)).toBe(0);
  });
});

describe('applyCorrect', () => {
  it('+15 when fast (msRemaining > 2/3)', () => {
    const s = initState({ startedAt: 0 });
    const n = applyCorrect(s, { msRemaining: TIMER_MS });
    expect(n.altitude).toBe(15);
    expect(n.correct).toBe(1);
    expect(n.questionsServed).toBe(1);
  });

  it('+12 when medium (1/3 < ms < 2/3)', () => {
    const s = initState({ startedAt: 0 });
    const n = applyCorrect(s, { msRemaining: TIMER_MS / 2 });
    expect(n.altitude).toBe(12);
  });

  it('+10 when slow (ms ≤ 1/3)', () => {
    const s = initState({ startedAt: 0 });
    const n = applyCorrect(s, { msRemaining: TIMER_MS / 4 });
    expect(n.altitude).toBe(10);
  });

  it('clamps to maxAltitude and marks won', () => {
    let s = initState({ startedAt: 0 });
    // Push toward 100 with 7×correct slow = 70, then 3×fast = 70+30 → clamp 100
    for (let i = 0; i < 7; i++) s = applyCorrect(s, { msRemaining: 0 });
    expect(s.altitude).toBe(70);
    s = applyCorrect(s, { msRemaining: TIMER_MS }); // +15 → 85
    s = applyCorrect(s, { msRemaining: TIMER_MS }); // +15 → 100
    expect(s.altitude).toBe(100);
    expect(s.outcome).toBe('won');
  });

  it('does not mutate the original state', () => {
    const s = initState({ startedAt: 0 });
    const snapshot = JSON.stringify(s);
    applyCorrect(s, { msRemaining: 5000 });
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it('ignored after run is finished', () => {
    const won = { ...initState({ startedAt: 0 }), altitude: 100, outcome: 'won' };
    expect(applyCorrect(won, { msRemaining: TIMER_MS })).toEqual(won);
  });
});

describe('applyWrongOrTimeout', () => {
  it('decreases altitude by 5, clamped at 0', () => {
    let s = initState({ startedAt: 0 });
    s = applyWrongOrTimeout(s);
    expect(s.altitude).toBe(0); // already at floor
    expect(s.wrong).toBe(1);
    expect(s.questionsServed).toBe(1);
  });

  it('clamps from low altitude', () => {
    const s = { ...initState({ startedAt: 0 }), altitude: 3 };
    expect(applyWrongOrTimeout(s).altitude).toBe(0);
  });

  it('triggers try-again when question budget exhausted without winning', () => {
    let s = initState({ maxAltitude: 100, maxQuestions: 4, startedAt: 0 });
    for (let i = 0; i < 4; i++) s = applyWrongOrTimeout(s);
    expect(s.outcome).toBe('try-again');
  });

  it('ignored after finished', () => {
    const ended = { ...initState({ startedAt: 0 }), outcome: 'try-again' };
    expect(applyWrongOrTimeout(ended)).toEqual(ended);
  });
});

describe('badges', () => {
  it('newBadgesEarned reports cloud at 30', () => {
    expect(newBadgesEarned(29, 30)).toEqual(['cloud']);
  });

  it('newBadgesEarned reports cumulative jumps', () => {
    expect(newBadgesEarned(0, 60)).toEqual(['cloud', 'mountain']);
    expect(newBadgesEarned(0, 100)).toEqual(['cloud', 'mountain', 'space']);
  });

  it('newBadgesEarned empty when no threshold crossed', () => {
    expect(newBadgesEarned(0, 29)).toEqual([]);
    expect(newBadgesEarned(70, 75)).toEqual([]);
  });

  it('badges list grows monotonically through a run', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { msRemaining: TIMER_MS }); // 15
    expect(s.badges).toEqual([]);
    s = applyCorrect(s, { msRemaining: TIMER_MS }); // 30
    expect(s.badges).toEqual(['cloud']);
    s = applyCorrect(s, { msRemaining: TIMER_MS }); // 45
    s = applyCorrect(s, { msRemaining: TIMER_MS }); // 60
    expect(s.badges).toEqual(['cloud', 'mountain']);
    // Even with a wrong answer afterwards, badges remain.
    s = applyWrongOrTimeout(s);
    expect(s.badges).toEqual(['cloud', 'mountain']);
  });

  it('space badge only when victorious (altitude 100)', () => {
    const s = { ...initState({ startedAt: 0 }), altitude: 99 };
    const next = applyCorrect(s, { msRemaining: 0 });
    // 99 + 10 = 109 clamped to 100, win, all 3 badges
    expect(next.altitude).toBe(100);
    expect(next.outcome).toBe('won');
    expect(next.badges).toEqual(['cloud', 'mountain', 'space']);
  });
});

describe('isFinished', () => {
  it('false while playing', () => {
    expect(isFinished(initState({ startedAt: 0 }))).toBe(false);
  });

  it('true for won', () => {
    expect(isFinished({ outcome: 'won' })).toBe(true);
  });

  it('true for try-again', () => {
    expect(isFinished({ outcome: 'try-again' })).toBe(true);
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused question', () => {
    expect(
      pickNextQuestion({ cache: [{ id: 1 }, { id: 2 }], usedIds: new Set([1]) }),
    ).toEqual({ id: 2 });
  });

  it('returns null when cache empty', () => {
    expect(pickNextQuestion({ cache: [], usedIds: new Set() })).toBeNull();
  });

  it('returns null when all used', () => {
    const cache = [{ id: 1 }, { id: 2 }];
    expect(pickNextQuestion({ cache, usedIds: new Set([1, 2]) })).toBeNull();
  });
});
