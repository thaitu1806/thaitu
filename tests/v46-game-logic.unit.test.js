import { describe, it, expect } from 'vitest';
import {
  TOTAL_POTS, MAX_QUESTIONS, MAX_STAGE,
  initState, applyCorrect, applyWrongOrTimeout, selectPot, isFinished, pickNextQuestion,
} from '../public/v46/game-logic.js';

describe('initState', () => {
  it('creates TOTAL_POTS empty pots', () => {
    const s = initState({ rng: () => 0, startedAt: 0 });
    expect(s.pots).toHaveLength(TOTAL_POTS);
    s.pots.forEach((p) => expect(p.stage).toBe(0));
    expect(s.outcome).toBe('tending');
  });
});

describe('applyCorrect', () => {
  it('grows selected pot by 1', () => {
    let s = initState({ rng: () => 0, startedAt: 0 });
    s = applyCorrect(s);
    // Selected has advanced; sum of stages should be 1
    expect(s.pots.reduce((a, p) => a + p.stage, 0)).toBe(1);
    expect(s.correct).toBe(1);
  });

  it('clamps at MAX_STAGE and counts as collected', () => {
    let s = initState({ rng: () => 0, startedAt: 0 });
    for (let i = 0; i < MAX_STAGE; i++) {
      s = { ...s, selectedPotIndex: 0 };
      s = applyCorrect(s);
    }
    expect(s.pots[0].stage).toBe(MAX_STAGE);
    expect(s.collectedCount).toBe(1);
  });

  it('rotates selectedPotIndex to next not-full pot', () => {
    let s = initState({ rng: () => 0, startedAt: 0 });
    // Fill pot 0 fully via 4 explicit selections
    for (let i = 0; i < MAX_STAGE; i++) {
      s = { ...s, selectedPotIndex: 0 };
      s = applyCorrect(s);
    }
    expect(s.pots[0].stage).toBe(MAX_STAGE);
    expect(s.collectedCount).toBe(1);
    // After completion, next call should pick a different pot
    const after = applyCorrect(s);
    expect(after.pots[0].stage).toBe(MAX_STAGE);
    expect(after.pots.slice(1).some((p) => p.stage > 0)).toBe(true);
  });

  it('outcome=won when all collected', () => {
    let s = initState({ rng: () => 0, startedAt: 0 });
    while (!isFinished(s)) s = applyCorrect(s);
    expect(s.outcome).toBe('won');
    expect(s.collectedCount).toBe(TOTAL_POTS);
  });
});

describe('applyWrongOrTimeout', () => {
  it('does not change pot stages', () => {
    let s = initState({ rng: () => 0, startedAt: 0 });
    const stagesBefore = s.pots.map((p) => p.stage);
    s = applyWrongOrTimeout(s);
    expect(s.pots.map((p) => p.stage)).toEqual(stagesBefore);
    expect(s.wrong).toBe(1);
  });

  it('outcome=closed when budget exhausted', () => {
    let s = initState({ rng: () => 0, startedAt: 0 });
    for (let i = 0; i < MAX_QUESTIONS; i++) s = applyWrongOrTimeout(s);
    expect(s.outcome).toBe('closed');
  });
});

describe('selectPot', () => {
  it('selects valid index', () => {
    const s = initState({ rng: () => 0, startedAt: 0 });
    expect(selectPot(s, 2).selectedPotIndex).toBe(2);
  });
  it('rejects out-of-range', () => {
    const s = initState({ rng: () => 0, startedAt: 0 });
    expect(selectPot(s, -1)).toEqual(s);
    expect(selectPot(s, 99)).toEqual(s);
  });
  it('rejects full pot', () => {
    let s = initState({ rng: () => 0, startedAt: 0 });
    s.pots[3].stage = MAX_STAGE;
    expect(selectPot(s, 3)).toEqual(s);
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused', () => {
    expect(pickNextQuestion({ cache: [{ id: 1 }, { id: 2 }], usedIds: new Set([1]) })).toEqual({ id: 2 });
  });
});
