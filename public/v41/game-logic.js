// V41 — Pure game logic for "Phiêu Lưu Cùng Mario".
// All functions here are pure (no DOM, no fetch, no mutation of inputs).
// Tests live under tests/v41-game-logic.*.test.js.
//
// Exported as ES module (consumed by Vitest) and also attached to `window.V41Logic`
// for direct use by `game.js` in the browser without a build step.

export const TOTAL_STATIONS = 8;
export const STARTING_LIVES = 3;
export const TIMER_SECONDS = 15;

/**
 * Build the initial game state.
 * @param {Partial<{ totalStations:number, lives:number, startedAt:number }>} [opts]
 */
export function initState(opts = {}) {
  return {
    totalStations: opts.totalStations ?? TOTAL_STATIONS,
    currentStation: 0,
    lives: opts.lives ?? STARTING_LIVES,
    correct: 0,
    wrong: 0,
    coins: 0,
    outcome: 'playing',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

/**
 * Apply a correct-answer event.
 * @param {object} state
 * @param {{ msRemaining?: number, timerMs?: number }} [opts]
 */
export function applyCorrect(state, opts = {}) {
  if (state.outcome !== 'playing') return state;

  const timerMs = opts.timerMs ?? TIMER_SECONDS * 1000;
  const msRemaining = clamp(opts.msRemaining ?? 0, 0, timerMs);
  const coinsAwarded = msRemaining > timerMs / 2 ? 2 : 1;

  const next = {
    ...state,
    currentStation: state.currentStation + 1,
    correct: state.correct + 1,
    coins: state.coins + coinsAwarded,
  };
  return finalize(next);
}

/**
 * Apply a wrong answer or timeout.
 * @param {object} state
 */
export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'playing') return state;
  const next = {
    ...state,
    lives: Math.max(0, state.lives - 1),
    wrong: state.wrong + 1,
  };
  return finalize(next);
}

/**
 * Whether the run has ended (won or lost).
 * @param {object} state
 */
export function isFinished(state) {
  return state.outcome === 'won' || state.outcome === 'lost';
}

/**
 * Compute star rating based on accuracy and lives lost.
 * @param {{ correct:number, total:number, livesLost:number }} params
 * @returns {0|1|2|3}
 */
export function computeStars({ correct, total, livesLost }) {
  if (total <= 0) return 0;
  const accuracy = correct / total;
  if (livesLost === 0 && accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  if (accuracy >= 0.4) return 1;
  return 0;
}

/**
 * Pick the next question from the cache, skipping anything already used.
 * Returns null if no unused question is available.
 * @param {{ cache: Array<{id:number|string}>, usedIds: Set<number|string> | Iterable<number|string> }} params
 */
export function pickNextQuestion({ cache, usedIds }) {
  if (!Array.isArray(cache) || cache.length === 0) return null;
  const used = usedIds instanceof Set ? usedIds : new Set(usedIds || []);
  for (const q of cache) {
    if (!q || q.id == null) continue;
    if (!used.has(q.id)) return q;
  }
  return null;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function clamp(n, min, max) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function finalize(state) {
  if (state.currentStation >= state.totalStations) {
    return { ...state, outcome: 'won' };
  }
  if (state.lives <= 0) {
    return { ...state, outcome: 'lost' };
  }
  return state;
}

// Browser global (consumed by game.js).
if (typeof window !== 'undefined') {
  window.V41Logic = {
    TOTAL_STATIONS,
    STARTING_LIVES,
    TIMER_SECONDS,
    initState,
    applyCorrect,
    applyWrongOrTimeout,
    isFinished,
    computeStars,
    pickNextQuestion,
  };
}
