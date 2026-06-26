// Unit tests for V45 (Robot Coding) pure logic.
import { describe, it, expect } from 'vitest';
import {
  COMMANDS,
  DIRECTIONS,
  MAX_QUESTIONS,
  LEVELS,
  initState,
  applyCorrect,
  applyWrongOrTimeout,
  isFinished,
  appendCommand,
  clearProgram,
  executeProgram,
  turnLeft,
  turnRight,
  moveForward,
  pickNextQuestion,
} from '../public/v45/game-logic.js';

describe('initState', () => {
  it('sets robot at start of level 1', () => {
    const s = initState({ startedAt: 0 });
    expect(s.level).toBe(1);
    expect(s.robot).toEqual(LEVELS[0].start);
  });

  it('clamps level into range', () => {
    expect(initState({ level: 999, startedAt: 0 }).level).toBe(LEVELS.length);
    expect(initState({ level: -3, startedAt: 0 }).level).toBe(1);
  });
});

describe('turnLeft / turnRight', () => {
  it('rotate by 90° CCW/CW', () => {
    expect(turnLeft('up')).toBe('left');
    expect(turnLeft('left')).toBe('down');
    expect(turnRight('up')).toBe('right');
    expect(turnRight('right')).toBe('down');
  });

  it('are inverses', () => {
    for (const d of DIRECTIONS) {
      expect(turnLeft(turnRight(d))).toBe(d);
      expect(turnRight(turnLeft(d))).toBe(d);
    }
  });

  it('returns input on unknown direction', () => {
    expect(turnLeft('zzz')).toBe('zzz');
    expect(turnRight('zzz')).toBe('zzz');
  });
});

describe('moveForward', () => {
  const grid = { rows: 5, cols: 5 };

  it('moves up one cell', () => {
    expect(moveForward({ row: 4, col: 0, facing: 'up' }, 'up', grid))
      .toEqual({ row: 3, col: 0, facing: 'up' });
  });

  it('stops at grid edge', () => {
    expect(moveForward({ row: 0, col: 0, facing: 'up' }, 'up', grid))
      .toEqual({ row: 0, col: 0, facing: 'up' });
  });

  it('stops at obstacle', () => {
    const obstacles = [{ row: 3, col: 0 }];
    expect(moveForward({ row: 4, col: 0, facing: 'up' }, 'up', grid, obstacles))
      .toEqual({ row: 4, col: 0, facing: 'up' });
  });

  it('jumps two when steps=2', () => {
    expect(moveForward({ row: 4, col: 0, facing: 'up' }, 'up', grid, [], 2))
      .toEqual({ row: 2, col: 0, facing: 'up' });
  });

  it('jump stops at obstacle within range', () => {
    const obstacles = [{ row: 3, col: 0 }];
    expect(moveForward({ row: 4, col: 0, facing: 'up' }, 'up', grid, obstacles, 2))
      .toEqual({ row: 4, col: 0, facing: 'up' });
  });
});

describe('applyCorrect / applyWrongOrTimeout', () => {
  it('correct adds one command to pool', () => {
    const seq = [0, 0.3, 0.7];
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    let s = initState({ startedAt: 0 });
    s = applyCorrect(s, { rng });
    expect(s.pool).toHaveLength(1);
    expect(COMMANDS).toContain(s.pool[0]);
    expect(s.correct).toBe(1);
  });

  it('wrong does not grow pool', () => {
    let s = initState({ startedAt: 0 });
    s = applyWrongOrTimeout(s);
    expect(s.pool).toHaveLength(0);
    expect(s.wrong).toBe(1);
  });

  it('try-again outcome when MAX_QUESTIONS reached without win', () => {
    let s = initState({ startedAt: 0 });
    for (let i = 0; i < MAX_QUESTIONS; i++) s = applyWrongOrTimeout(s);
    expect(s.outcome).toBe('try-again');
  });
});

describe('appendCommand / clearProgram', () => {
  it('appendCommand moves item from pool to program', () => {
    const s = { ...initState({ startedAt: 0 }), pool: ['forward', 'left'] };
    const s2 = appendCommand(s, 0);
    expect(s2.program).toEqual(['forward']);
    expect(s2.pool).toEqual(['left']);
  });

  it('appendCommand ignores out-of-range index', () => {
    const s = { ...initState({ startedAt: 0 }), pool: ['forward'] };
    expect(appendCommand(s, 5)).toEqual(s);
    expect(appendCommand(s, -1)).toEqual(s);
  });

  it('clearProgram puts program back into pool', () => {
    const s = { ...initState({ startedAt: 0 }), pool: ['left'], program: ['forward', 'right'] };
    const s2 = clearProgram(s);
    expect(s2.program).toEqual([]);
    expect(s2.pool).toEqual(['left', 'forward', 'right']);
  });
});

describe('executeProgram', () => {
  it('moves robot deterministically to the goal', () => {
    let s = initState({ level: 1, startedAt: 0 });
    s = { ...s, program: ['forward', 'forward', 'forward', 'forward', 'right', 'forward', 'forward', 'forward', 'forward'] };
    const s2 = executeProgram(s);
    expect(s2.outcome).toBe('won');
    expect(s2.robot.row).toBe(0);
    expect(s2.robot.col).toBe(4);
  });

  it('without reaching goal, program clears and game continues', () => {
    let s = initState({ level: 1, startedAt: 0 });
    s = { ...s, program: ['forward'] };
    const s2 = executeProgram(s);
    expect(s2.outcome).toBe('playing');
    expect(s2.program).toEqual([]);
    expect(s2.robot.row).toBe(3);
  });

  it('runs respect obstacles', () => {
    let s = initState({ level: 2, startedAt: 0 });
    s = { ...s, program: ['forward', 'forward', 'forward'] };
    const s2 = executeProgram(s);
    // Robot starts (4,0), obstacle at (2,2). Moving up 3 times: 4→3→2→1 — no obstacle in col 0. So row should be 1.
    expect(s2.robot.row).toBe(1);
  });

  it('returns input when not playing', () => {
    const won = { ...initState({ startedAt: 0 }), outcome: 'won' };
    expect(executeProgram(won)).toEqual(won);
  });

  it('is deterministic for same input', () => {
    let s1 = initState({ level: 1, startedAt: 0 });
    s1 = { ...s1, program: ['forward', 'forward'] };
    let s2 = initState({ level: 1, startedAt: 0 });
    s2 = { ...s2, program: ['forward', 'forward'] };
    expect(executeProgram(s1).robot).toEqual(executeProgram(s2).robot);
  });
});

describe('isFinished', () => {
  it('false during play', () => {
    expect(isFinished(initState({ startedAt: 0 }))).toBe(false);
  });
  it('true for won and try-again', () => {
    expect(isFinished({ outcome: 'won' })).toBe(true);
    expect(isFinished({ outcome: 'try-again' })).toBe(true);
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
