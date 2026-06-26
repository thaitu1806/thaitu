import { describe, it, expect } from 'vitest';
import {
  MAX_QUESTIONS, MAX_DEPTH, OXYGEN_START, TREASURE_COMBO, ZONE_AT,
  initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
} from '../public/v50/game-logic.js';

describe('initState', () => {
  it('starts diving at depth 0 with full oxygen', () => {
    const s = initState({ startedAt: 0 });
    expect(s.outcome).toBe('diving');
    expect(s.depth).toBe(0);
    expect(s.oxygen).toBe(OXYGEN_START);
  });
});

describe('applyCorrect', () => {
  it('increments depth and comboRun', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.depth).toBe(1);
    expect(s.comboRun).toBe(1);
  });

  it('grants treasure every TREASURE_COMBO streak', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < TREASURE_COMBO; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.treasures).toHaveLength(1);
  });

  it('caps depth at MAX_DEPTH', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < MAX_DEPTH + 5 && s.outcome === 'diving'; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.depth).toBe(MAX_DEPTH);
    expect(s.outcome).toBe('won');
  });
});

describe('applyWrongOrTimeout', () => {
  it('decrements oxygen and resets comboRun', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.comboRun).toBe(2);
    s = applyWrongOrTimeout(s);
    expect(s.oxygen).toBe(OXYGEN_START - 1);
    expect(s.comboRun).toBe(0);
  });

  it('oxygen never below 0', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < OXYGEN_START + 3; i++) s = applyWrongOrTimeout(s);
    expect(s.oxygen).toBe(0);
  });
});

describe('terminal conditions', () => {
  it('wins when depth === MAX_DEPTH', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < MAX_DEPTH && s.outcome === 'diving'; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.outcome).toBe('won');
    expect(isFinished(s)).toBe(true);
  });

  it('surfaces when oxygen reaches 0', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < OXYGEN_START; i++) s = applyWrongOrTimeout(s);
    expect(s.outcome).toBe('surfaced');
    expect(isFinished(s)).toBe(true);
  });
});

describe('ZONE_AT', () => {
  it('classifies depths into named zones', () => {
    expect(ZONE_AT(0).id).toBe('shallow');
    expect(ZONE_AT(3).id).toBe('reef');
    expect(ZONE_AT(6).id).toBe('deep');
    expect(ZONE_AT(9).id).toBe('abyss');
    expect(ZONE_AT(MAX_DEPTH).id).toBe('abyss');
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused', () => {
    expect(pickNextQuestion({ cache: [{ id: 1 }, { id: 2 }], usedIds: new Set([1]) })).toEqual({ id: 2 });
  });
});
