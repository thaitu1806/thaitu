import { describe, it, expect } from 'vitest';
import {
  MAX_QUESTIONS, GARMENTS_GOAL, PANELS_PER_GARMENT, GOLD_STREAK,
  initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
} from '../public/v57/game-logic.js';

describe('initState', () => {
  it('starts sewing empty', () => {
    const s = initState({ startedAt: 0 });
    expect(s.outcome).toBe('sewing');
    expect(s.garments).toEqual([]);
    expect(s.panels).toBe(0);
  });
});

describe('applyCorrect', () => {
  it('adds 1 panel', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.panels).toBe(1);
  });

  it('4 panels → 1 garment', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < PANELS_PER_GARMENT; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.garments).toHaveLength(1);
    expect(s.panels).toBe(0);
  });

  it('streak >= GOLD_STREAK → garment is gold', () => {
    let s = initState({ startedAt: 0 });
    // 4 corrects = 1 normal garment (streak=4)
    for (let i = 0; i < 4; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.garments[0].gold).toBe(false);
    // Next 4 corrects at streak 5..8 → gold garment
    for (let i = 0; i < 4; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.garments[1].gold).toBe(true);
  });
});

describe('applyWrongOrTimeout', () => {
  it('loses partial panels and resets streak', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.panels).toBe(2);
    s = applyWrongOrTimeout(s);
    expect(s.panels).toBe(0);
    expect(s.streak).toBe(0);
  });
});

describe('terminal', () => {
  it('wins at GARMENTS_GOAL', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < 100 && s.outcome === 'sewing'; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.garments.length).toBe(GARMENTS_GOAL);
    expect(s.outcome).toBe('won');
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused', () => {
    expect(pickNextQuestion({ cache: [{ id: 1 }], usedIds: new Set() })).toEqual({ id: 1 });
  });
});
