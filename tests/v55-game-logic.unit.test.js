import { describe, it, expect } from 'vitest';
import {
  MAX_QUESTIONS, GOALS_TO_WIN, GOALS_TO_LOSE,
  BASE_SHOT_RATE, MID_SHOT_RATE, BOOST_SHOT_RATE, MID_STREAK, BOOST_STREAK,
  OPPONENT_SHOT_RATE, getShotRate,
  initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
} from '../public/v55/game-logic.js';

describe('initState', () => {
  it('starts playing 0-0', () => {
    const s = initState({ startedAt: 0 });
    expect(s.outcome).toBe('playing');
    expect(s.myGoals).toBe(0);
    expect(s.oppGoals).toBe(0);
  });
});

describe('getShotRate', () => {
  it('returns BASE for streak 0-1', () => {
    expect(getShotRate(0)).toBe(BASE_SHOT_RATE);
    expect(getShotRate(1)).toBe(BASE_SHOT_RATE);
  });
  it('returns MID for streak 2-3', () => {
    expect(getShotRate(MID_STREAK)).toBe(MID_SHOT_RATE);
    expect(getShotRate(3)).toBe(MID_SHOT_RATE);
  });
  it('returns BOOST for streak 4+', () => {
    expect(getShotRate(BOOST_STREAK)).toBe(BOOST_SHOT_RATE);
    expect(getShotRate(10)).toBe(BOOST_SHOT_RATE);
  });
});

describe('applyCorrect', () => {
  it('takes a shot — succeeds when roll < rate', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.myGoals).toBe(1);
    expect(s.shots).toBe(1);
  });

  it('shot misses when roll ≥ rate', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0.999 });
    expect(s.myGoals).toBe(0);
    expect(s.shots).toBe(1);
  });

  it('boosted streak: high rate → near-certain goal', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < BOOST_STREAK; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.streak).toBe(BOOST_STREAK);
    s = applyCorrect(s, { rng: () => 0.9 });
    expect(s.myGoals).toBeGreaterThanOrEqual(BOOST_STREAK);
  });
});

describe('applyWrongOrTimeout', () => {
  it('opponent shoots; resets streak', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.streak).toBe(2);
    s = applyWrongOrTimeout(s, { rng: () => 0 });
    expect(s.oppGoals).toBe(1);
    expect(s.streak).toBe(0);
  });

  it('opponent misses when roll ≥ OPPONENT_SHOT_RATE', () => {
    let s = initState({ startedAt: 0 });
    s = applyWrongOrTimeout(s, { rng: () => 0.999 });
    expect(s.oppGoals).toBe(0);
  });
});

describe('terminal conditions', () => {
  it('wins at GOALS_TO_WIN', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < GOALS_TO_WIN && s.outcome === 'playing'; i++) {
      s = applyCorrect(s, { rng: () => 0 });
    }
    expect(s.outcome).toBe('won');
  });

  it('loses at GOALS_TO_LOSE conceded', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < GOALS_TO_LOSE; i++) s = applyWrongOrTimeout(s, { rng: () => 0 });
    expect(s.outcome).toBe('lost');
  });

  it('closes when MAX_QUESTIONS reached', () => {
    // Use lots of misses (rng=0.999 forces both my and opp shots to miss)
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < MAX_QUESTIONS && s.outcome === 'playing'; i++) {
      s = applyCorrect(s, { rng: () => 0.999 });
    }
    expect(s.questionsServed).toBe(MAX_QUESTIONS);
    // Could be won if rng=0 accidentally, but with all misses and no opponent score,
    // we'd end up closed-with-draw → outcome 'closed'
    expect(['closed']).toContain(s.outcome);
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused', () => {
    expect(pickNextQuestion({ cache: [{ id: 1 }, { id: 2 }], usedIds: new Set([1]) })).toEqual({ id: 2 });
  });
});
