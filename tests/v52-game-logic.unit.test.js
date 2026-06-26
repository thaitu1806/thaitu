import { describe, it, expect } from 'vitest';
import {
  MAX_QUESTIONS, LANTERN_COUNT, WIN_THRESHOLD, FIREWORK_STREAK, LANTERN_COLORS,
  initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
} from '../public/v52/game-logic.js';

describe('initState', () => {
  it('starts celebrating with no lanterns lit', () => {
    const s = initState({ startedAt: 0 });
    expect(s.outcome).toBe('celebrating');
    expect(s.slots).toHaveLength(LANTERN_COUNT);
    expect(s.litCount).toBe(0);
    expect(s.streak).toBe(0);
  });
});

describe('applyCorrect', () => {
  it('lights next lantern and assigns a color', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.litCount).toBe(1);
    expect(s.slots[0].lit).toBe(true);
    expect(LANTERN_COLORS).toContain(s.slots[0].color);
  });

  it('launches firework every FIREWORK_STREAK in a row', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < FIREWORK_STREAK; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.fireworks).toHaveLength(1);
  });

  it('fills all lanterns → won immediately', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < LANTERN_COUNT + 5 && s.outcome === 'celebrating'; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.litCount).toBe(LANTERN_COUNT);
    expect(s.outcome).toBe('won');
  });
});

describe('applyWrongOrTimeout', () => {
  it('resets streak but keeps litCount', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.streak).toBe(2);
    s = applyWrongOrTimeout(s);
    expect(s.streak).toBe(0);
    expect(s.litCount).toBe(2);
    expect(s.wrong).toBe(1);
  });
});

describe('terminal conditions', () => {
  it('wins at end if litCount ≥ WIN_THRESHOLD', () => {
    let s = initState({ startedAt: 0, maxQuestions: WIN_THRESHOLD });
    for (let i = 0; i < WIN_THRESHOLD; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.outcome).toBe('won');
  });

  it('closes if litCount < WIN_THRESHOLD when MAX_QUESTIONS reached', () => {
    let s = initState({ startedAt: 0, maxQuestions: 5 });
    s = applyCorrect(s, { rng: () => 0 });
    for (let i = 0; i < 4; i++) s = applyWrongOrTimeout(s);
    expect(s.questionsServed).toBe(5);
    expect(s.litCount).toBe(1);
    expect(s.outcome).toBe('closed');
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused', () => {
    expect(pickNextQuestion({ cache: [{ id: 1 }, { id: 2 }], usedIds: new Set([1]) })).toEqual({ id: 2 });
  });
});
