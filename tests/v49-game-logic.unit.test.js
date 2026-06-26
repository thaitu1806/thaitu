import { describe, it, expect } from 'vitest';
import {
  MAX_QUESTIONS, TRACKS_TO_BUILD, BEATS_PER_TRACK, GROOVE_MAX, GROOVE_THRESHOLD,
  initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
} from '../public/v49/game-logic.js';

describe('initState', () => {
  it('starts mixing with empty tracks', () => {
    const s = initState({ startedAt: 0 });
    expect(s.outcome).toBe('mixing');
    expect(s.tracks).toEqual([]);
    expect(s.currentBeats).toBe(0);
    expect(s.groove).toBe(0);
  });
});

describe('applyCorrect', () => {
  it('first correct adds 1 beat', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s);
    expect(s.currentBeats).toBe(1);
    expect(s.groove).toBe(1);
  });

  it('building 4 beats completes a track', () => {
    let s = initState({ startedAt: 0 });
    // First 3 corrects: 1 beat each (groove < threshold). 4th: groove==3, adds 2 beats → total 5 → 1 track + 1 leftover
    for (let i = 0; i < 4; i++) s = applyCorrect(s);
    expect(s.tracks).toHaveLength(1);
    // After track completed, leftover = 5 - 4 = 1
    expect(s.currentBeats).toBe(1);
  });

  it('high groove adds 2 beats per correct', () => {
    let s = initState({ startedAt: 0 });
    // first 3 corrects: 1 beat each → currentBeats=3, groove=3
    s = applyCorrect(s);
    s = applyCorrect(s);
    s = applyCorrect(s);
    expect(s.groove).toBe(GROOVE_THRESHOLD);
    // 4th correct: groove is 3 (>=threshold), adds 2 beats → 3+2=5, completes track
    s = applyCorrect(s);
    expect(s.tracks).toHaveLength(1);
    expect(s.tracks[0].perfect).toBe(true);
  });

  it('groove caps at GROOVE_MAX', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < 10; i++) s = applyCorrect(s);
    expect(s.groove).toBeLessThanOrEqual(GROOVE_MAX);
  });

  it('does not exceed tracksGoal', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < 100 && s.outcome === 'mixing'; i++) s = applyCorrect(s);
    expect(s.tracks.length).toBe(TRACKS_TO_BUILD);
    expect(s.outcome).toBe('won');
  });
});

describe('applyWrongOrTimeout', () => {
  it('drops groove by 1, never below 0', () => {
    let s = initState({ startedAt: 0 });
    s = applyWrongOrTimeout(s);
    expect(s.groove).toBe(0);
    expect(s.wrong).toBe(1);
  });

  it('groove drops but currentBeats unchanged', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s);
    s = applyCorrect(s);
    expect(s.currentBeats).toBe(2);
    s = applyWrongOrTimeout(s);
    expect(s.currentBeats).toBe(2);
    expect(s.groove).toBe(1);
  });
});

describe('terminal conditions', () => {
  it('wins when tracksGoal reached', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < 100 && s.outcome === 'mixing'; i++) s = applyCorrect(s);
    expect(s.outcome).toBe('won');
    expect(isFinished(s)).toBe(true);
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
