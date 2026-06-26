import { describe, it, expect } from 'vitest';
import {
  MAX_QUESTIONS, POTIONS_GOAL, INGREDIENTS_PER_POTION, LEGENDARY_STREAK, INGREDIENT_COLORS,
  initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
} from '../public/v54/game-logic.js';

describe('initState', () => {
  it('starts brewing with empty cauldron', () => {
    const s = initState({ startedAt: 0 });
    expect(s.outcome).toBe('brewing');
    expect(s.cauldron.color).toBe(null);
    expect(s.cauldron.count).toBe(0);
  });
});

describe('applyCorrect', () => {
  it('first correct picks a color', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(INGREDIENT_COLORS).toContain(s.cauldron.color);
    expect(s.cauldron.count).toBe(1);
  });

  it('3 corrects → 1 potion', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < INGREDIENTS_PER_POTION; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.potions).toHaveLength(1);
    expect(s.cauldron.color).toBe(null);
    expect(s.potions[0].legendary).toBe(false);
  });

  it('5 streak → next potion is legendary', () => {
    let s = initState({ startedAt: 0 });
    // 3 corrects produce 1 normal potion (streak=3)
    for (let i = 0; i < 3; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.potions[0].legendary).toBe(false);
    // 2 more produce no new potion yet (cauldron count = 2, streak=5)
    s = applyCorrect(s, { rng: () => 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.potions).toHaveLength(1);
    // 6th correct completes the next potion at streak=6 (>= 5)
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.potions).toHaveLength(2);
    expect(s.potions[1].legendary).toBe(true);
  });
});

describe('applyWrongOrTimeout', () => {
  it('empties cauldron and resets streak', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.cauldron.count).toBe(2);
    s = applyWrongOrTimeout(s);
    expect(s.cauldron.color).toBe(null);
    expect(s.cauldron.count).toBe(0);
    expect(s.streak).toBe(0);
  });
});

describe('terminal conditions', () => {
  it('wins when POTIONS_GOAL reached', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < 100 && s.outcome === 'brewing'; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.potions.length).toBe(POTIONS_GOAL);
    expect(s.outcome).toBe('won');
  });

  it('closes when MAX_QUESTIONS reached', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < MAX_QUESTIONS; i++) s = applyWrongOrTimeout(s);
    expect(s.outcome).toBe('closed');
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused', () => {
    expect(pickNextQuestion({ cache: [{ id: 1 }, { id: 2 }], usedIds: new Set([1]) })).toEqual({ id: 2 });
  });
});
