// Property-based tests for V45 (Robot Coding) pure logic.
// P1–P7 from requirements.md
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  COMMANDS,
  DIRECTIONS,
  MAX_QUESTIONS,
  LEVELS,
  initState,
  applyCorrect,
  applyWrongOrTimeout,
  isFinished,
  executeProgram,
  turnLeft,
  turnRight,
  moveForward,
} from '../public/v45/game-logic.js';

describe('V45 P1 — command unlock', () => {
  it('pool grows by exactly 1 per correct', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }).map((n) => n / 100), (val) => {
        const s = initState({ startedAt: 0 });
        const n = applyCorrect(s, { rng: () => val });
        expect(n.pool.length).toBe(s.pool.length + 1);
      }),
    );
  });

  it('pool unchanged on wrong/timeout', () => {
    fc.assert(
      fc.property(fc.constant(0), () => {
        const s = initState({ startedAt: 0 });
        const n = applyWrongOrTimeout(s);
        expect(n.pool.length).toBe(s.pool.length);
      }),
    );
  });
});

describe('V45 P2 — grid bounds', () => {
  it('moveForward never escapes the grid', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),
        fc.integer({ min: 0, max: 4 }),
        fc.constantFrom(...DIRECTIONS),
        fc.integer({ min: 1, max: 5 }),
        (row, col, dir, steps) => {
          const grid = { rows: 5, cols: 5 };
          const next = moveForward({ row, col, facing: dir }, dir, grid, [], steps);
          expect(next.row).toBeGreaterThanOrEqual(0);
          expect(next.row).toBeLessThan(grid.rows);
          expect(next.col).toBeGreaterThanOrEqual(0);
          expect(next.col).toBeLessThan(grid.cols);
        },
      ),
    );
  });
});

describe('V45 P3 — win predicate', () => {
  it('outcome=won iff robot at goal after execute', () => {
    // Set up a deterministic case: level 1, program reaches goal.
    const s = { ...initState({ level: 1, startedAt: 0 }),
      program: ['forward', 'forward', 'forward', 'forward', 'right', 'forward', 'forward', 'forward', 'forward'] };
    const s2 = executeProgram(s);
    expect(s2.outcome).toBe('won');
    expect(s2.robot.row).toBe(s.goal.row);
    expect(s2.robot.col).toBe(s.goal.col);
  });
});

describe('V45 P4 — try-again threshold', () => {
  it('reaches try-again after MAX_QUESTIONS wrongs', () => {
    fc.assert(
      fc.property(fc.constant(0), () => {
        let s = initState({ startedAt: 0 });
        for (let i = 0; i < MAX_QUESTIONS; i++) s = applyWrongOrTimeout(s);
        expect(s.outcome).toBe('try-again');
      }),
    );
  });
});

describe('V45 P5 — execution determinism', () => {
  it('same initial state + program → same final position', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...COMMANDS), { minLength: 0, maxLength: 8 }),
        (program) => {
          const a = { ...initState({ level: 3, startedAt: 0 }), program: [...program] };
          const b = { ...initState({ level: 3, startedAt: 0 }), program: [...program] };
          const ra = executeProgram(a).robot;
          const rb = executeProgram(b).robot;
          expect(ra).toEqual(rb);
        },
      ),
    );
  });
});

describe('V45 P6 — turnLeft ∘ turnRight = id', () => {
  it('rotations are inverses for every direction', () => {
    fc.assert(
      fc.property(fc.constantFrom(...DIRECTIONS), (d) => {
        expect(turnLeft(turnRight(d))).toBe(d);
        expect(turnRight(turnLeft(d))).toBe(d);
      }),
    );
  });

  it('four lefts return to identity', () => {
    fc.assert(
      fc.property(fc.constantFrom(...DIRECTIONS), (d) => {
        let cur = d;
        for (let i = 0; i < 4; i++) cur = turnLeft(cur);
        expect(cur).toBe(d);
      }),
    );
  });
});

describe('V45 P7 — session payload validity', () => {
  it('any ended state has correct≥0 and totalAnswered≥correct', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { maxLength: MAX_QUESTIONS + 2 }),
        (events) => {
          let s = initState({ startedAt: 0 });
          for (const ok of events) {
            if (isFinished(s)) break;
            s = ok ? applyCorrect(s, { rng: () => 0 }) : applyWrongOrTimeout(s);
          }
          const total = s.correct + s.wrong;
          expect(total).toBeGreaterThanOrEqual(s.correct);
          expect(s.correct).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });
});
