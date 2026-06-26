import { describe, it, expect } from 'vitest';
import {
  MAX_QUESTIONS, TOTAL_SPECIES, STREAK_FOR_BOOST, BASE_CATCH_RATE, BOOST_CATCH_RATE,
  SPECIES, initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
} from '../public/v51/game-logic.js';

// rng helper: sequence
const seq = (arr) => { let i = 0; return () => arr[i++ % arr.length]; };

describe('initState', () => {
  it('starts hunting with no captures', () => {
    const s = initState({ startedAt: 0 });
    expect(s.outcome).toBe('hunting');
    expect(s.captured).toEqual([]);
    expect(s.streak).toBe(0);
  });
});

describe('applyCorrect', () => {
  it('always increments correct and attempts', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.correct).toBe(1);
    expect(s.attempts).toBe(1);
  });

  it('captures when roll < catch rate', () => {
    // rng sequence: first call picks the wild (any value), second is the roll
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: seq([0.0, 0.0]) });
    expect(s.captured.length).toBe(1);
    expect(s.catches).toBe(1);
  });

  it('does not capture when roll >= catch rate', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: seq([0.0, 0.99]) });
    expect(s.captured.length).toBe(0);
    expect(s.catches).toBe(0);
  });

  it('streak boosts catch rate to BOOST_CATCH_RATE', () => {
    // After STREAK_FOR_BOOST consecutive corrects, even a higher roll should succeed
    let s = initState({ startedAt: 0 });
    // First 3 corrects: pick + roll each. Use rng=0 to maximize catches.
    s = applyCorrect(s, { rng: () => 0 });
    s = applyCorrect(s, { rng: () => 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.streak).toBe(3);
    // Now streak >= boost: roll up to BOOST_CATCH_RATE should still catch (e.g. 0.8 < 0.9)
    const s4 = applyCorrect(s, { rng: seq([0.0, 0.85]) });
    expect(s4.catches).toBeGreaterThan(s.catches);
  });

  it('streak below boost: roll between BASE and BOOST should miss', () => {
    let s = initState({ startedAt: 0 });
    // First attempt, streak=1 < boost threshold. roll = 0.7 (>BASE 0.55, <BOOST 0.9)
    s = applyCorrect(s, { rng: seq([0.0, 0.7]) });
    expect(s.catches).toBe(0);
  });

  it('captures all 8 species → won', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < 50 && s.outcome === 'hunting'; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.captured.length).toBe(TOTAL_SPECIES);
    expect(s.outcome).toBe('won');
  });
});

describe('applyWrongOrTimeout', () => {
  it('resets streak', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.streak).toBe(2);
    s = applyWrongOrTimeout(s);
    expect(s.streak).toBe(0);
    expect(s.wrong).toBe(1);
  });
});

describe('terminal conditions', () => {
  it('closes when MAX_QUESTIONS reached without winning', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < MAX_QUESTIONS; i++) s = applyWrongOrTimeout(s);
    expect(s.outcome).toBe('closed');
    expect(isFinished(s)).toBe(true);
  });
});

describe('SPECIES catalog', () => {
  it('has at least TOTAL_SPECIES entries with id/emoji/name', () => {
    expect(SPECIES.length).toBeGreaterThanOrEqual(TOTAL_SPECIES);
    SPECIES.forEach((s) => {
      expect(s.id).toBeTruthy();
      expect(s.emoji).toBeTruthy();
      expect(s.name).toBeTruthy();
    });
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused', () => {
    expect(pickNextQuestion({ cache: [{ id: 1 }, { id: 2 }], usedIds: new Set([1]) })).toEqual({ id: 2 });
  });
});
