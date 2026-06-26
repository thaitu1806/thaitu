import { describe, it, expect } from 'vitest';
import {
  MAX_QUESTIONS, FINISH_LINE, STAMINA_MAX,
  GEAR_SLOW, GEAR_NORMAL, GEAR_FAST, MID_STREAK, FAST_STREAK,
  getSpeed,
  initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
} from '../public/v59/game-logic.js';

describe('initState', () => {
  it('starts racing at 0m with full stamina', () => {
    const s = initState({ startedAt: 0 });
    expect(s.outcome).toBe('racing');
    expect(s.distance).toBe(0);
    expect(s.stamina).toBe(STAMINA_MAX);
  });
});

describe('getSpeed', () => {
  it('returns GEAR_SLOW when stamina=0', () => {
    expect(getSpeed(5, 0)).toBe(GEAR_SLOW);
  });
  it('returns GEAR_NORMAL at base streak with stamina', () => {
    expect(getSpeed(0, 5)).toBe(GEAR_NORMAL);
    expect(getSpeed(1, 5)).toBe(GEAR_NORMAL);
  });
  it('returns higher speed for MID/FAST streaks', () => {
    expect(getSpeed(MID_STREAK, 5)).toBeGreaterThanOrEqual(GEAR_NORMAL);
    expect(getSpeed(FAST_STREAK, 5)).toBe(GEAR_FAST);
  });
});

describe('applyCorrect', () => {
  it('advances by gear speed', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s);
    expect(s.distance).toBe(GEAR_NORMAL);
  });

  it('caps at FINISH_LINE', () => {
    let s = initState({ startedAt: 0, finishLine: 20 });
    for (let i = 0; i < 50 && s.outcome === 'racing'; i++) s = applyCorrect(s);
    expect(s.distance).toBe(20);
    expect(s.outcome).toBe('won');
  });

  it('low stamina forces slow speed', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < STAMINA_MAX; i++) s = applyWrongOrTimeout(s);
    expect(s.stamina).toBe(0);
    const before = s.distance;
    s = applyCorrect(s);
    expect(s.distance - before).toBe(GEAR_SLOW);
  });
});

describe('applyWrongOrTimeout', () => {
  it('drops stamina and resets streak', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s);
    s = applyCorrect(s);
    expect(s.streak).toBe(2);
    s = applyWrongOrTimeout(s);
    expect(s.stamina).toBe(STAMINA_MAX - 1);
    expect(s.streak).toBe(0);
  });
});

describe('terminal', () => {
  it('closes at MAX_QUESTIONS', () => {
    let s = initState({ startedAt: 0, finishLine: 1000 });
    for (let i = 0; i < MAX_QUESTIONS; i++) s = applyWrongOrTimeout(s);
    expect(s.outcome).toBe('closed');
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused', () => {
    expect(pickNextQuestion({ cache: [{ id: 1 }], usedIds: new Set() })).toEqual({ id: 1 });
  });
});
