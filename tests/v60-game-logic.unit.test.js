import { describe, it, expect } from 'vitest';
import {
  MAX_QUESTIONS, STORIES_GOAL, CHAPTERS_PER_STORY, MORAL_STREAK, TALES,
  initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
} from '../public/v60/game-logic.js';

describe('initState', () => {
  it('starts reading at chapter 0', () => {
    const s = initState({ startedAt: 0 });
    expect(s.outcome).toBe('reading');
    expect(s.chapters).toBe(0);
    expect(s.storiesDone).toEqual([]);
  });
});

describe('applyCorrect', () => {
  it('advances chapter', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.chapters).toBe(1);
  });

  it('4 chapters → 1 story finished', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < CHAPTERS_PER_STORY; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.storiesDone).toHaveLength(1);
    expect(s.chapters).toBe(0);
  });

  it('streak %% MORAL_STREAK === 0 collects a moral', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < MORAL_STREAK; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.morals.length).toBeGreaterThanOrEqual(1);
  });
});

describe('applyWrongOrTimeout', () => {
  it('rolls back chapter and resets streak', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng: () => 0 });
    s = applyCorrect(s, { rng: () => 0 });
    expect(s.chapters).toBe(2);
    s = applyWrongOrTimeout(s);
    expect(s.chapters).toBe(1);
    expect(s.streak).toBe(0);
  });

  it('chapters never below 0', () => {
    let s = initState({ startedAt: 0 });
    s = applyWrongOrTimeout(s);
    expect(s.chapters).toBe(0);
  });
});

describe('terminal', () => {
  it('wins at STORIES_GOAL', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < 100 && s.outcome === 'reading'; i++) s = applyCorrect(s, { rng: () => 0 });
    expect(s.storiesDone).toHaveLength(STORIES_GOAL);
    expect(s.outcome).toBe('won');
  });

  it('closes at MAX_QUESTIONS', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < MAX_QUESTIONS; i++) s = applyWrongOrTimeout(s);
    expect(s.outcome).toBe('closed');
  });
});

describe('TALES catalog', () => {
  it('has at least STORIES_GOAL tales with id/emoji/name/moral', () => {
    expect(TALES.length).toBeGreaterThanOrEqual(STORIES_GOAL);
    TALES.forEach((t) => {
      expect(t.id).toBeTruthy();
      expect(t.emoji).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.moral).toBeTruthy();
    });
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused', () => {
    expect(pickNextQuestion({ cache: [{ id: 1 }], usedIds: new Set() })).toEqual({ id: 1 });
  });
});
