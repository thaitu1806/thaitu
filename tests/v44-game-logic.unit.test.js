// Unit tests for V44 (Shark Galaxy) pure logic.
import { describe, it, expect } from 'vitest';
import {
  GOAL_DISTANCE,
  BOSS_THRESHOLD,
  MAX_BOSS_ATTEMPTS,
  RACE_GAIN,
  RACE_PENALTY,
  BOSS_GAIN,
  BOSS_PENALTY,
  RACE_TIMER_SECONDS,
  BOSS_TIMER_SECONDS,
  initState,
  applyCorrect,
  applyWrongOrTimeout,
  isFinished,
  getPhase,
  timerSecondsFor,
  pickNextQuestion,
} from '../public/v44/game-logic.js';

describe('initState', () => {
  it('starts at distance 0 in race phase', () => {
    const s = initState({ startedAt: 0 });
    expect(s.distance).toBe(0);
    expect(s.phase).toBe('race');
    expect(s.outcome).toBe('playing');
    expect(s.bossAttempts).toBe(0);
  });
});

describe('getPhase', () => {
  it('race below boss threshold', () => {
    expect(getPhase(0)).toBe('race');
    expect(getPhase(BOSS_THRESHOLD - 1)).toBe('race');
  });

  it('boss from threshold up to (but not including) goal', () => {
    expect(getPhase(BOSS_THRESHOLD)).toBe('boss');
    expect(getPhase(GOAL_DISTANCE - 1)).toBe('boss');
  });

  it('race at or above goal (won)', () => {
    expect(getPhase(GOAL_DISTANCE)).toBe('race');
  });
});

describe('timerSecondsFor', () => {
  it('race phase uses RACE timer', () => {
    expect(timerSecondsFor('race')).toBe(RACE_TIMER_SECONDS);
  });
  it('boss phase uses shorter BOSS timer', () => {
    expect(timerSecondsFor('boss')).toBe(BOSS_TIMER_SECONDS);
    expect(BOSS_TIMER_SECONDS).toBeLessThan(RACE_TIMER_SECONDS);
  });
});

describe('applyCorrect — race phase', () => {
  it('adds RACE_GAIN', () => {
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s);
    expect(s.distance).toBe(RACE_GAIN);
    expect(s.correct).toBe(1);
    expect(s.bossAttempts).toBe(0);
  });

  it('caps at goal and wins', () => {
    let s = initState({ startedAt: 0 });
    // 8 race-phase × 10 = 80, then 4 boss-phase × 6 = 24 → 104 clamped to 100
    for (let i = 0; i < 12; i++) s = applyCorrect(s);
    expect(s.distance).toBe(GOAL_DISTANCE);
    expect(s.outcome).toBe('won');
  });

  it('does not mutate input', () => {
    const s = initState({ startedAt: 0 });
    const snap = JSON.stringify(s);
    applyCorrect(s);
    expect(JSON.stringify(s)).toBe(snap);
  });
});

describe('applyCorrect — boss phase', () => {
  it('adds BOSS_GAIN once distance ≥ threshold', () => {
    let s = { ...initState({ startedAt: 0 }), distance: BOSS_THRESHOLD };
    s = applyCorrect(s);
    expect(s.distance).toBe(BOSS_THRESHOLD + BOSS_GAIN);
    expect(s.bossAttempts).toBe(1);
  });

  it('boss correct at distance 95 caps win', () => {
    let s = { ...initState({ startedAt: 0 }), distance: 95 };
    s = applyCorrect(s);
    expect(s.distance).toBe(GOAL_DISTANCE);
    expect(s.outcome).toBe('won');
  });
});

describe('applyWrongOrTimeout — race phase', () => {
  it('subtracts RACE_PENALTY, clamped at 0', () => {
    let s = initState({ startedAt: 0 });
    s = applyWrongOrTimeout(s);
    expect(s.distance).toBe(0);
    expect(s.wrong).toBe(1);
    expect(s.bossAttempts).toBe(0);
  });

  it('penalty applied from positive distance', () => {
    const s = { ...initState({ startedAt: 0 }), distance: 30 };
    expect(applyWrongOrTimeout(s).distance).toBe(30 - RACE_PENALTY);
  });
});

describe('applyWrongOrTimeout — boss phase', () => {
  it('subtracts BOSS_PENALTY and increments bossAttempts', () => {
    let s = { ...initState({ startedAt: 0 }), distance: BOSS_THRESHOLD };
    s = applyWrongOrTimeout(s);
    expect(s.distance).toBe(BOSS_THRESHOLD - BOSS_PENALTY);
    expect(s.bossAttempts).toBe(1);
  });

  it('5 wrong attempts in boss → lose', () => {
    let s = { ...initState({ startedAt: 0 }), distance: BOSS_THRESHOLD };
    for (let i = 0; i < MAX_BOSS_ATTEMPTS; i++) {
      s = applyWrongOrTimeout(s);
      if (i < MAX_BOSS_ATTEMPTS - 1 && s.distance < BOSS_THRESHOLD) {
        // Re-enter boss bracket for the next attempt to count
        s = { ...s, distance: BOSS_THRESHOLD };
      }
    }
    expect(s.bossAttempts).toBe(MAX_BOSS_ATTEMPTS);
    expect(s.outcome).toBe('lost');
  });
});

describe('isFinished', () => {
  it('false while playing', () => {
    expect(isFinished(initState({ startedAt: 0 }))).toBe(false);
  });
  it('true for won/lost', () => {
    expect(isFinished({ outcome: 'won' })).toBe(true);
    expect(isFinished({ outcome: 'lost' })).toBe(true);
  });
});

describe('pickNextQuestion', () => {
  it('returns first unused', () => {
    expect(pickNextQuestion({ cache: [{ id: 1 }, { id: 2 }], usedIds: new Set([1]) })).toEqual({ id: 2 });
  });
  it('returns null when empty', () => {
    expect(pickNextQuestion({ cache: [], usedIds: new Set() })).toBeNull();
  });
});
