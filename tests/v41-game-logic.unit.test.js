// Unit tests for V41 (Mario Adventure) pure logic boundary cases.
import { describe, it, expect } from 'vitest';
import {
  TOTAL_STATIONS,
  STARTING_LIVES,
  TIMER_SECONDS,
  initState,
  applyCorrect,
  applyWrongOrTimeout,
  isFinished,
  computeStars,
  pickNextQuestion,
} from '../public/v41/game-logic.js';

const TIMER_MS = TIMER_SECONDS * 1000;

describe('initState', () => {
  it('defaults to 8 stations, 3 lives, no progress', () => {
    const s = initState({ startedAt: 0 });
    expect(s.totalStations).toBe(TOTAL_STATIONS);
    expect(s.lives).toBe(STARTING_LIVES);
    expect(s.currentStation).toBe(0);
    expect(s.correct).toBe(0);
    expect(s.wrong).toBe(0);
    expect(s.coins).toBe(0);
    expect(s.outcome).toBe('playing');
  });

  it('respects overrides', () => {
    const s = initState({ totalStations: 4, lives: 5, startedAt: 100 });
    expect(s.totalStations).toBe(4);
    expect(s.lives).toBe(5);
    expect(s.startedAt).toBe(100);
  });
});

describe('applyCorrect — coin reward boundaries', () => {
  it('msRemaining > half timer → 2 coins', () => {
    const s = initState({ startedAt: 0 });
    const next = applyCorrect(s, { msRemaining: TIMER_MS - 1 });
    expect(next.coins).toBe(2);
  });

  it('msRemaining exactly half → 1 coin (boundary is strict >)', () => {
    const s = initState({ startedAt: 0 });
    const next = applyCorrect(s, { msRemaining: TIMER_MS / 2 });
    expect(next.coins).toBe(1);
  });

  it('msRemaining = 0 → 1 coin', () => {
    const s = initState({ startedAt: 0 });
    const next = applyCorrect(s, { msRemaining: 0 });
    expect(next.coins).toBe(1);
  });

  it('msRemaining defaults to 0 when omitted → 1 coin', () => {
    const s = initState({ startedAt: 0 });
    const next = applyCorrect(s);
    expect(next.coins).toBe(1);
  });
});

describe('applyCorrect — win condition', () => {
  it('advancing to totalStations sets outcome to won', () => {
    let s = initState({ totalStations: 2, startedAt: 0 });
    s = applyCorrect(s, { msRemaining: TIMER_MS });
    expect(s.outcome).toBe('playing');
    s = applyCorrect(s, { msRemaining: TIMER_MS });
    expect(s.outcome).toBe('won');
    expect(s.currentStation).toBe(2);
  });

  it('does not mutate the original state', () => {
    const s = initState({ startedAt: 0 });
    const before = JSON.stringify(s);
    applyCorrect(s, { msRemaining: 0 });
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('applyWrongOrTimeout — lose condition', () => {
  it('three consecutive wrongs ends with lost', () => {
    let s = initState({ startedAt: 0 });
    s = applyWrongOrTimeout(s);
    s = applyWrongOrTimeout(s);
    expect(s.outcome).toBe('playing');
    expect(s.lives).toBe(1);
    s = applyWrongOrTimeout(s);
    expect(s.lives).toBe(0);
    expect(s.outcome).toBe('lost');
  });

  it('lives never goes below 0', () => {
    let s = initState({ lives: 1, startedAt: 0 });
    s = applyWrongOrTimeout(s);
    expect(s.lives).toBe(0);
    s = applyWrongOrTimeout(s); // already lost
    expect(s.lives).toBe(0);
  });
});

describe('computeStars', () => {
  it('zero questions → 0 stars', () => {
    expect(computeStars({ correct: 0, total: 0, livesLost: 0 })).toBe(0);
  });

  it('100% accuracy and 0 lives lost → 3 stars', () => {
    expect(computeStars({ correct: 8, total: 8, livesLost: 0 })).toBe(3);
  });

  it('100% accuracy but lost a life → 2 stars', () => {
    expect(computeStars({ correct: 8, total: 8, livesLost: 1 })).toBe(2);
  });

  it('70% accuracy → 2 stars', () => {
    expect(computeStars({ correct: 7, total: 10, livesLost: 0 })).toBe(2);
  });

  it('69% accuracy → 1 star', () => {
    expect(computeStars({ correct: 4, total: 10, livesLost: 0 })).toBe(1);
  });

  it('below 40% accuracy → 0 stars', () => {
    expect(computeStars({ correct: 3, total: 10, livesLost: 1 })).toBe(0);
  });

  it('accuracy exactly 90% with 0 lives lost → 3 stars', () => {
    expect(computeStars({ correct: 9, total: 10, livesLost: 0 })).toBe(3);
  });

  it('accuracy 89% with 0 lives lost → 2 stars', () => {
    // 17/20 = 0.85 < 0.9 → not 3 stars; still ≥ 0.7 → 2 stars
    expect(computeStars({ correct: 17, total: 20, livesLost: 0 })).toBe(2);
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused question', () => {
    const cache = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(pickNextQuestion({ cache, usedIds: new Set([1]) })).toEqual({ id: 2 });
  });

  it('returns null when cache is empty', () => {
    expect(pickNextQuestion({ cache: [], usedIds: new Set() })).toBeNull();
  });

  it('returns null when all questions are used', () => {
    const cache = [{ id: 1 }, { id: 2 }];
    expect(pickNextQuestion({ cache, usedIds: new Set([1, 2]) })).toBeNull();
  });

  it('accepts iterable for usedIds (not just Set)', () => {
    const cache = [{ id: 1 }, { id: 2 }];
    expect(pickNextQuestion({ cache, usedIds: [1] })).toEqual({ id: 2 });
  });

  it('skips entries with missing id', () => {
    const cache = [{ id: null }, { id: 5 }];
    expect(pickNextQuestion({ cache, usedIds: new Set() })).toEqual({ id: 5 });
  });

  it('handles non-array cache gracefully', () => {
    expect(pickNextQuestion({ cache: null, usedIds: new Set() })).toBeNull();
  });
});

describe('isFinished', () => {
  it('false while playing', () => {
    expect(isFinished(initState({ startedAt: 0 }))).toBe(false);
  });

  it('true when won', () => {
    let s = initState({ totalStations: 1, startedAt: 0 });
    s = applyCorrect(s, { msRemaining: 0 });
    expect(isFinished(s)).toBe(true);
  });

  it('true when lost', () => {
    let s = initState({ lives: 1, startedAt: 0 });
    s = applyWrongOrTimeout(s);
    expect(isFinished(s)).toBe(true);
  });
});
