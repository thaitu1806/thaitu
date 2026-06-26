import { describe, it, expect } from 'vitest';
import {
  MAX_QUESTIONS, TOTAL_DINOS, DANGER_MAX, COMBO_BONUS,
  initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
} from '../public/v48/game-logic.js';

describe('initState', () => {
  it('starts rescuing with no danger and all dinos unrescued', () => {
    const s = initState({ startedAt: 0 });
    expect(s.outcome).toBe('rescuing');
    expect(s.danger).toBe(0);
    expect(s.rescuedCount).toBe(0);
    expect(s.dinos).toHaveLength(TOTAL_DINOS);
    expect(s.dinos.every((d) => d.rescued === false)).toBe(true);
  });
});

describe('applyCorrect', () => {
  it('rescues one dino on first correct', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s);
    expect(s.rescuedCount).toBe(1);
    expect(s.dinos[0].rescued).toBe(true);
    expect(s.dinos[1].rescued).toBe(false);
    expect(s.comboRun).toBe(1);
  });

  it('rescues 2 dinos on the 3rd correct streak (combo bonus)', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s); // 1 rescue
    s = applyCorrect(s); // 1 rescue
    expect(s.rescuedCount).toBe(2);
    s = applyCorrect(s); // 1 + bonus rescue
    expect(s.rescuedCount).toBe(4);
    expect(s.comboRun).toBe(3);
  });

  it('does not exceed TOTAL_DINOS', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < 30 && s.outcome === 'rescuing'; i++) s = applyCorrect(s);
    expect(s.rescuedCount).toBe(TOTAL_DINOS);
    expect(s.outcome).toBe('won');
  });
});

describe('applyWrongOrTimeout', () => {
  it('increments danger and resets comboRun', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s);
    s = applyCorrect(s);
    expect(s.comboRun).toBe(2);
    s = applyWrongOrTimeout(s);
    expect(s.danger).toBe(1);
    expect(s.comboRun).toBe(0);
    expect(s.wrong).toBe(1);
  });

  it('breaks combo before bonus triggers', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s); // r=1, combo=1
    s = applyCorrect(s); // r=2, combo=2
    s = applyWrongOrTimeout(s); // combo reset
    s = applyCorrect(s); // r=3, combo=1 — no bonus
    expect(s.rescuedCount).toBe(3);
  });
});

describe('terminal conditions', () => {
  it('wins when all dinos rescued', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < 30 && s.outcome === 'rescuing'; i++) s = applyCorrect(s);
    expect(s.outcome).toBe('won');
    expect(isFinished(s)).toBe(true);
  });

  it('erupts when danger reaches max', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < DANGER_MAX; i++) s = applyWrongOrTimeout(s);
    expect(s.outcome).toBe('erupted');
    expect(isFinished(s)).toBe(true);
  });

  it('closes when MAX_QUESTIONS reached without win or eruption', () => {
    let s = initState({ startedAt: 0, maxQuestions: 10 });
    // alternate correct/wrong without filling danger or rescuing all
    // 5 correct + 4 wrong; danger=4, rescued=5+bonuses
    // To avoid winning, use mixed pattern with maxQuestions=10
    s = applyCorrect(s); // r=1
    s = applyWrongOrTimeout(s); // d=1
    s = applyCorrect(s); // r=2
    s = applyWrongOrTimeout(s); // d=2
    s = applyCorrect(s); // r=3 (combo broken so no bonus)
    s = applyWrongOrTimeout(s); // d=3
    s = applyCorrect(s); // r=4
    s = applyWrongOrTimeout(s); // d=4
    s = applyCorrect(s); // r=5
    s = applyCorrect(s); // r=6 (combo=2)
    expect(s.questionsServed).toBe(10);
    expect(s.outcome).toBe('closed');
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused', () => {
    expect(pickNextQuestion({ cache: [{ id: 1 }, { id: 2 }], usedIds: new Set([1]) })).toEqual({ id: 2 });
  });
  it('returns null when empty', () => {
    expect(pickNextQuestion({ cache: [], usedIds: new Set() })).toBe(null);
  });
});
