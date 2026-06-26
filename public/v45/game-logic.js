// V45 — Pure game logic for "Lập Trình Robot Mini".
// All functions pure; no DOM, no fetch, no mutation.
// Tests under tests/v45-game-logic.*.test.js.

export const COMMANDS = ['forward', 'left', 'right', 'jump'];
export const DIRECTIONS = ['up', 'right', 'down', 'left']; // CW order
export const MAX_QUESTIONS = 16;

// Built-in maze levels (5x5).
export const LEVELS = [
  {
    rows: 5, cols: 5,
    start: { row: 4, col: 0, facing: 'up' },
    goal:  { row: 0, col: 4 },
    obstacles: [],
  },
  {
    rows: 5, cols: 5,
    start: { row: 4, col: 0, facing: 'up' },
    goal:  { row: 0, col: 4 },
    obstacles: [{ row: 2, col: 2 }],
  },
  {
    rows: 5, cols: 5,
    start: { row: 4, col: 0, facing: 'up' },
    goal:  { row: 0, col: 4 },
    obstacles: [{ row: 2, col: 1 }, { row: 2, col: 3 }],
  },
  {
    rows: 5, cols: 5,
    start: { row: 4, col: 2, facing: 'up' },
    goal:  { row: 0, col: 2 },
    obstacles: [{ row: 1, col: 2 }, { row: 3, col: 2 }, { row: 2, col: 1 }],
  },
  {
    rows: 5, cols: 5,
    start: { row: 4, col: 0, facing: 'up' },
    goal:  { row: 0, col: 4 },
    obstacles: [{ row: 3, col: 1 }, { row: 2, col: 2 }, { row: 1, col: 3 }, { row: 2, col: 0 }],
  },
];

export function initState(opts = {}) {
  const level = Math.max(1, Math.min(LEVELS.length, opts.level ?? 1));
  const cfg = LEVELS[level - 1];
  return {
    level,
    grid: { rows: cfg.rows, cols: cfg.cols },
    start: { ...cfg.start },
    goal: { ...cfg.goal },
    obstacles: cfg.obstacles.map((o) => ({ ...o })),
    robot: { ...cfg.start },
    pool: [],
    program: [],
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    outcome: 'playing',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

/**
 * Unlock one random command per correct answer.
 * @param {object} state
 * @param {{ rng?: () => number }} [opts]
 */
export function applyCorrect(state, opts = {}) {
  if (state.outcome !== 'playing') return state;
  const rng = opts.rng ?? Math.random;
  const cmd = COMMANDS[Math.floor(rng() * COMMANDS.length)] ?? COMMANDS[0];
  return finalize({
    ...state,
    pool: [...state.pool, cmd],
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'playing') return state;
  return finalize({
    ...state,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function isFinished(state) {
  return state.outcome === 'won' || state.outcome === 'try-again';
}

/**
 * Append a command from the pool at index `idx` to the program (consumes from pool).
 */
export function appendCommand(state, idx) {
  if (idx < 0 || idx >= state.pool.length) return state;
  const cmd = state.pool[idx];
  const pool = [...state.pool.slice(0, idx), ...state.pool.slice(idx + 1)];
  return { ...state, pool, program: [...state.program, cmd] };
}

export function clearProgram(state) {
  return { ...state, program: [], pool: [...state.pool, ...state.program] };
}

/**
 * Execute the program step-by-step. Returns final state with updated robot position.
 * Pure: never mutates input.
 */
export function executeProgram(state) {
  if (state.outcome !== 'playing') return state;
  let robot = { ...state.robot };
  for (const cmd of state.program) {
    robot = step(cmd, robot, state.grid, state.obstacles);
    if (robot.row === state.goal.row && robot.col === state.goal.col) {
      return finalize({
        ...state,
        robot,
        program: [],
        outcome: 'won',
      });
    }
  }
  // Program done without reaching goal — reset program, robot stays.
  return finalize({
    ...state,
    robot,
    program: [],
  });
}

function step(cmd, robot, grid, obstacles) {
  switch (cmd) {
    case 'left':
      return { ...robot, facing: turnLeft(robot.facing) };
    case 'right':
      return { ...robot, facing: turnRight(robot.facing) };
    case 'forward':
      return moveForward(robot, robot.facing, grid, obstacles, 1);
    case 'jump':
      return moveForward(robot, robot.facing, grid, obstacles, 2);
    default:
      return robot;
  }
}

export function turnLeft(dir) {
  const i = DIRECTIONS.indexOf(dir);
  if (i < 0) return dir;
  return DIRECTIONS[(i + DIRECTIONS.length - 1) % DIRECTIONS.length];
}

export function turnRight(dir) {
  const i = DIRECTIONS.indexOf(dir);
  if (i < 0) return dir;
  return DIRECTIONS[(i + 1) % DIRECTIONS.length];
}

/**
 * Move forward `steps` cells along `dir`. Stops at the first obstacle or grid edge.
 * @returns new robot position object {row, col, facing}.
 */
export function moveForward(robot, dir, grid, obstacles = [], steps = 1) {
  let { row, col } = robot;
  const obsSet = new Set(obstacles.map((o) => `${o.row},${o.col}`));
  for (let s = 0; s < steps; s++) {
    const next = stepOnce(row, col, dir);
    if (next.row < 0 || next.row >= grid.rows || next.col < 0 || next.col >= grid.cols) break;
    if (obsSet.has(`${next.row},${next.col}`)) break;
    row = next.row;
    col = next.col;
  }
  return { row, col, facing: dir };
}

function stepOnce(row, col, dir) {
  switch (dir) {
    case 'up':    return { row: row - 1, col };
    case 'down':  return { row: row + 1, col };
    case 'left':  return { row, col: col - 1 };
    case 'right': return { row, col: col + 1 };
    default:      return { row, col };
  }
}

export function pickNextQuestion({ cache, usedIds }) {
  if (!Array.isArray(cache) || cache.length === 0) return null;
  const used = usedIds instanceof Set ? usedIds : new Set(usedIds || []);
  for (const q of cache) {
    if (!q || q.id == null) continue;
    if (!used.has(q.id)) return q;
  }
  return null;
}

function finalize(state) {
  if (state.outcome !== 'playing') return state;
  if (state.questionsServed >= state.maxQuestions) {
    return { ...state, outcome: 'try-again' };
  }
  return state;
}

// Browser global.
if (typeof window !== 'undefined') {
  window.V45Logic = {
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
  };
}
