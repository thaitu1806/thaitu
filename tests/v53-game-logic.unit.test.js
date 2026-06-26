import { describe, it, expect } from 'vitest';
import {
  MAX_QUESTIONS, FLOORS, ALARMS_MAX, INTEL_STREAK,
  initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
} from '../public/v53/game-logic.js';

describe('initState', () => {
  it('starts sneaking on floor 0 with no alarms', () => {
    const s = initState({ startedAt: 0 });
    expect(s.outcome).toBe('sneaking');
    expect(s.floor).toBe(0);
    expect(s.alarms).toBe(0);
  });
});

describe('applyCorrect', () => {
  it('advances floor by 1', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.floor).toBe(1);
    expect(s.streak).toBe(1);
  });

  it('collects intel every INTEL_STREAK', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < INTEL_STREAK; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.intel).toHaveLength(1);
  });
});

describe('applyWrongOrTimeout', () => {
  it('raises alarms and resets streak', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    s = applyWrongOrTimeout(s);
    expect(s.alarms).toBe(1);
    expect(s.streak).toBe(0);
  });
});

describe('terminal conditions', () => {
  it('wins when reaching top floor', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < FLOORS && s.outcome === 'sneaking'; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.outcome).toBe('won');
    expect(isFinished(s)).toBe(true);
  });

  it('caught when alarms reach max', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < ALARMS_MAX; i++) s = applyWrongOrTimeout(s);
    expect(s.outcome).toBe('caught');
  });

  it('closes when MAX_QUESTIONS reached', () => {
    let s = initState({ startedAt: 0, maxQuestions: 4, maxAlarms: 10, floors: 100 });
    for (let i = 0; i < 4; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.outcome).toBe('closed');
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused', () => {
    expect(pickNextQuestion({ cache: [{ id: 1 }, { id: 2 }], usedIds: new Set([1]) })).toEqual({ id: 2 });
  });
});
