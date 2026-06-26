import { describe, it, expect } from 'vitest';
import {
  MAX_QUESTIONS, SNOWMEN_GOAL, PIECES_PER_SNOWMAN,
  initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
} from '../public/v56/game-logic.js';

describe('initState', () => {
  it('starts building empty', () => {
    const s = initState({ startedAt: 0 });
    expect(s.outcome).toBe('building');
    expect(s.snowmen).toEqual([]);
    expect(s.currentPieces).toBe(0);
  });
});

describe('applyCorrect', () => {
  it('adds 1 piece', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.currentPieces).toBe(1);
  });

  it('3 pieces → 1 snowman', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < PIECES_PER_SNOWMAN; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.snowmen).toHaveLength(1);
    expect(s.currentPieces).toBe(0);
  });
});

describe('applyWrongOrTimeout', () => {
  it('melts a piece and resets streak', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    s = applyCorrect(s, { rng: () => 0 });
    s = applyWrongOrTimeout(s);
    expect(s.currentPieces).toBe(1);
    expect(s.streak).toBe(0);
  });

  it('never below 0', () => {
    let s = initState({ startedAt: 0 });
    s = applyWrongOrTimeout(s);
    expect(s.currentPieces).toBe(0);
  });
});

describe('terminal', () => {
  it('wins at SNOWMEN_GOAL', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < 100 && s.outcome === 'building'; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.snowmen.length).toBe(SNOWMEN_GOAL);
    expect(s.outcome).toBe('won');
  });

  it('closes at MAX_QUESTIONS', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < MAX_QUESTIONS; i++) s = applyWrongOrTimeout(s);
    expect(s.outcome).toBe('closed');
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused', () => {
    expect(pickNextQuestion({ cache: [{ id: 1 }], usedIds: new Set() })).toEqual({ id: 1 });
  });
});
