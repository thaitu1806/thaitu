// V44 — Pure game logic for "Vũ Trụ Cá Mập".
// All functions pure. Tests under tests/v44-game-logic.*.test.js.

export const GOAL_DISTANCE = 100;
export const BOSS_THRESHOLD = 80;
export const MAX_BOSS_ATTEMPTS = 5;
export const RACE_TIMER_SECONDS = 15;
export const BOSS_TIMER_SECONDS = 8;
export const RACE_GAIN = 10;
export const RACE_PENALTY = 4;
export const BOSS_GAIN = 6;
export const BOSS_PENALTY = 8;

/**
 * @param {Partial<{ goalDistance:number, bossThreshold:number, maxBossAttempts:number, startedAt:number }>} [opts]
 */
export function initState(opts = {}) {
  return {
    distance: 0,
    goalDistance: opts.goalDistance ?? GOAL_DISTANCE,
    bossThreshold: opts.bossThreshold ?? BOSS_THRESHOLD,
    correct: 0,
    wrong: 0,
    phase: 'race',
    bossAttempts: 0,
    maxBossAttempts: opts.maxBossAttempts ?? MAX_BOSS_ATTEMPTS,
    outcome: 'playing',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

/**
 * Determine phase from distance + boss attempts.
 * Note: phase is informational; not strictly equal to "in boss bracket".
 */
export function getPhase(distance, _bossAttempts, _maxBossAttempts) {
  if (distance >= BOSS_THRESHOLD && distance < GOAL_DISTANCE) return 'boss';
  return 'race';
}

export function timerSecondsFor(phase) {
  return phase === 'boss' ? BOSS_TIMER_SECONDS : RACE_TIMER_SECONDS;
}

/**
 * Apply a correct answer.
 * @param {object} state
 */
export function applyCorrect(state) {
  if (state.outcome !== 'playing') return state;
  const phase = getPhase(state.distance, state.bossAttempts, state.maxBossAttempts);
  const gain = phase === 'boss' ? BOSS_GAIN : RACE_GAIN;
  const distance = Math.min(state.goalDistance, state.distance + gain);
  return finalize({
    ...state,
    distance,
    correct: state.correct + 1,
    bossAttempts: phase === 'boss' ? state.bossAttempts + 1 : state.bossAttempts,
  }, phase);
}

/**
 * Apply a wrong answer or timeout.
 * @param {object} state
 */
export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'playing') return state;
  const phase = getPhase(state.distance, state.bossAttempts, state.maxBossAttempts);
  const penalty = phase === 'boss' ? BOSS_PENALTY : RACE_PENALTY;
  const distance = Math.max(0, state.distance - penalty);
  return finalize({
    ...state,
    distance,
    wrong: state.wrong + 1,
    bossAttempts: phase === 'boss' ? state.bossAttempts + 1 : state.bossAttempts,
  }, phase);
}

export function isFinished(state) {
  return state.outcome === 'won' || state.outcome === 'lost';
}

/**
 * @param {{ cache:Array<{id:number|string}>, usedIds:Set<number|string>|Iterable<number|string> }} params
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

function finalize(state, prevPhase) {
  // Recompute phase after delta.
  const nextPhase = getPhase(state.distance, state.bossAttempts, state.maxBossAttempts);
  state = { ...state, phase: nextPhase };

  if (state.distance >= state.goalDistance) {
    return { ...state, distance: state.goalDistance, outcome: 'won', phase: 'race' };
  }
  // Loss requires being in boss bracket AND exhausting attempts.
  if (prevPhase === 'boss' && state.bossAttempts >= state.maxBossAttempts && state.distance < state.goalDistance) {
    return { ...state, outcome: 'lost' };
  }
  return state;
}

// Browser global.
if (typeof window !== 'undefined') {
  window.V44Logic = {
    GOAL_DISTANCE,
    BOSS_THRESHOLD,
    MAX_BOSS_ATTEMPTS,
    RACE_TIMER_SECONDS,
    BOSS_TIMER_SECONDS,
    RACE_GAIN,
    RACE_PENALTY,
    BOSS_GAIN,
    BOSS_PENALTY,
    initState,
    applyCorrect,
    applyWrongOrTimeout,
    isFinished,
    getPhase,
    timerSecondsFor,
    pickNextQuestion,
  };
}
