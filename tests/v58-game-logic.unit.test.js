import { describe, it, expect } from 'vitest';
import {
  MAX_QUESTIONS, CYCLES_GOAL, STAGES_PER_CYCLE, BONUS_STREAK,
  initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
} from '../public/v58/game-logic.js';

describe('initState', () => {
  it('starts farming at stage 0', () => {
    const s = initState({ startedAt: 0 });
    expect(s.outcome).toBe('farming');
    expect(s.stage).toBe(0);
    expect(s.cycles).toBe(0);
  });
});

describe('applyCorrect', () => {
  it('advances stage', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s);
    expect(s.stage).toBe(1);
  });

  it('4 corrects → 1 cycle and bushel', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < STAGES_PER_CYCLE; i++) s = applyCorrect(s);
    expect(s.cycles).toBe(1);
    expect(s.stage).toBe(0);
    // 4 streak >= BONUS_STREAK so should be a bonus cycle (2 bushels)
    expect(s.bushels).toBe(2);
    expect(s.bonusCycles).toBe(1);
  });

  it('combo broken → no bonus on next cycle', () => {
    let s = initState({ startedAt: 0 });
    // 1 correct, 1 wrong, then 4 corrects → cycle with streak=4 (bonus)
    s = applyCorrect(s); // stage 1
    s = applyWrongOrTimeout(s); // stage 0, streak 0
    for (let i = 0; i < 4; i++) s = applyCorrect(s);
    expect(s.cycles).toBe(1);
    expect(s.bushels).toBe(2); // 4-streak gives bonus
    // Take a wrong, then 1 correct (streak=1) — partial progress, no cycle yet
    s = applyWrongOrTimeout(s);
    for (let i = 0; i < 3; i++) s = applyCorrect(s);
    expect(s.cycles).toBe(1);
    expect(s.stage).toBe(3);
    s = applyCorrect(s); // stage 4 → cycle, streak=4 → bonus
    expect(s.cycles).toBe(2);
  });
});

describe('applyWrongOrTimeout', () => {
  it('rolls stage back and resets streak', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s);
    s = applyCorrect(s);
    expect(s.stage).toBe(2);
    s = applyWrongOrTimeout(s);
    expect(s.stage).toBe(1);
    expect(s.streak).toBe(0);
  });

  it('never below 0', () => {
    let s = initState({ startedAt: 0 });
    s = applyWrongOrTimeout(s);
    expect(s.stage).toBe(0);
  });
});

describe('terminal', () => {
  it('wins at CYCLES_GOAL', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < 100 && s.outcome === 'farming'; i++) s = applyCorrect(s);
    expect(s.cycles).toBe(CYCLES_GOAL);
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
