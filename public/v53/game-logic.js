// V53 — Pure logic for "Đặc Vụ Mèo".
export const MAX_QUESTIONS = 22;
export const FLOORS = 10;
export const ALARMS_MAX = 3;
export const INTEL_STREAK = 4;
export const TIMER_SECONDS = 22;

export const INTEL_EMOJIS = ['📁', '💼', '🔑', '💾', '📸', '🔍'];

export function initState(opts = {}) {
  return {
    floor: 0,
    floors: opts.floors ?? FLOORS,
    alarms: 0,
    maxAlarms: opts.maxAlarms ?? ALARMS_MAX,
    streak: 0,
    intel: [],
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    outcome: 'sneaking',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state, opts = {}) {
  if (state.outcome !== 'sneaking') return state;
  const rng = opts.rng ?? Math.random;
  const floor = Math.min(state.floors, state.floor + 1);
  const streak = state.streak + 1;
  const intel = state.intel.slice();
  if (streak > 0 && streak % INTEL_STREAK === 0) {
    const emoji = INTEL_EMOJIS[Math.floor(rng() * INTEL_EMOJIS.length)] ?? INTEL_EMOJIS[0];
    intel.push(emoji);
  }
  return finalize({
    ...state,
    floor,
    streak,
    intel,
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'sneaking') return state;
  return finalize({
    ...state,
    alarms: state.alarms + 1,
    streak: 0,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function isFinished(state) {
  return state.outcome !== 'sneaking';
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
  if (state.floor >= state.floors) {
    return { ...state, outcome: 'won' };
  }
  if (state.alarms >= state.maxAlarms) {
    return { ...state, outcome: 'caught' };
  }
  if (state.questionsServed >= state.maxQuestions) {
    return { ...state, outcome: 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V53Logic = {
    MAX_QUESTIONS, FLOORS, ALARMS_MAX, INTEL_STREAK, TIMER_SECONDS, INTEL_EMOJIS,
    initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
  };
}
