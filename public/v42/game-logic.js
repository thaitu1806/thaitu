// V42 — Pure game logic for "Khinh Khí Cầu Bay Cao".
// All functions are pure (no DOM, no fetch, no input mutation).
// Tests live under tests/v42-game-logic.*.test.js.

export const MAX_ALTITUDE = 100;
export const MAX_QUESTIONS = 12;
export const TIMER_SECONDS = 20;
export const BASE_GAIN = 10;
export const PENALTY = 5;

// Sorted ascending by threshold. ID stays stable across releases.
export const BADGES = [
  { id: 'cloud',    icon: '☁️',  label: 'Mây',     threshold: 30 },
  { id: 'mountain', icon: '🏔️', label: 'Núi',     threshold: 60 },
  { id: 'space',    icon: '🌌',  label: 'Vũ Trụ',  threshold: 100 },
];

/**
 * Build the initial game state.
 * @param {Partial<{ maxAltitude:number, maxQuestions:number, startedAt:number }>} [opts]
 */
export function initState(opts = {}) {
  return {
    altitude: 0,
    maxAltitude: opts.maxAltitude ?? MAX_ALTITUDE,
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    badges: [],
    outcome: 'playing',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

/**
 * Compute the bonus altitude awarded for a correct answer based on timing.
 * @param {number} msRemaining Remaining timer when the answer was given.
 * @param {number} timerMs Total timer in ms (defaults to TIMER_SECONDS * 1000).
 * @returns {0 | 2 | 5}
 */
export function computeBonus(msRemaining, timerMs = TIMER_SECONDS * 1000) {
  const ms = clamp(msRemaining, 0, timerMs);
  const frac = timerMs > 0 ? ms / timerMs : 0;
  if (frac > 2 / 3) return 5;
  if (frac > 1 / 3) return 2;
  return 0;
}

/**
 * Apply a correct-answer event.
 * @param {object} state
 * @param {{ msRemaining?:number, timerMs?:number }} [opts]
 */
export function applyCorrect(state, opts = {}) {
  if (state.outcome !== 'playing') return state;
  const timerMs = opts.timerMs ?? TIMER_SECONDS * 1000;
  const ms = clamp(opts.msRemaining ?? 0, 0, timerMs);
  const gain = BASE_GAIN + computeBonus(ms, timerMs);
  const altitude = Math.min(state.maxAltitude, state.altitude + gain);
  const badges = mergeBadges(state.badges, badgesAt(altitude));
  const next = {
    ...state,
    altitude,
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
    badges,
  };
  return finalize(next);
}

/**
 * Apply a wrong-answer or timeout event.
 * @param {object} state
 */
export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'playing') return state;
  const altitude = Math.max(0, state.altitude - PENALTY);
  const next = {
    ...state,
    altitude,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  };
  return finalize(next);
}

/**
 * @param {object} state
 */
export function isFinished(state) {
  return state.outcome === 'won' || state.outcome === 'try-again';
}

/**
 * Compute newly earned badges given a transition from prevAltitude → nextAltitude.
 * @param {number} prevAltitude
 * @param {number} nextAltitude
 * @returns {string[]} Badge IDs newly earned in this transition.
 */
export function newBadgesEarned(prevAltitude, nextAltitude) {
  const before = new Set(badgesAt(prevAltitude));
  const after = badgesAt(nextAltitude);
  return after.filter((id) => !before.has(id));
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

function clamp(n, min, max) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function badgesAt(altitude) {
  return BADGES.filter((b) => altitude >= b.threshold).map((b) => b.id);
}

function mergeBadges(existing, candidate) {
  const set = new Set(existing);
  for (const id of candidate) set.add(id);
  // Return in the BADGES declaration order, so output is deterministic.
  return BADGES.filter((b) => set.has(b.id)).map((b) => b.id);
}

function finalize(state) {
  if (state.altitude >= state.maxAltitude) {
    return { ...state, altitude: state.maxAltitude, outcome: 'won' };
  }
  if (state.questionsServed >= state.maxQuestions) {
    return { ...state, outcome: 'try-again' };
  }
  return state;
}

// Browser global (consumed by game.js).
if (typeof window !== 'undefined') {
  window.V42Logic = {
    MAX_ALTITUDE,
    MAX_QUESTIONS,
    TIMER_SECONDS,
    BASE_GAIN,
    PENALTY,
    BADGES,
    initState,
    applyCorrect,
    applyWrongOrTimeout,
    isFinished,
    computeBonus,
    newBadgesEarned,
    pickNextQuestion,
  };
}
