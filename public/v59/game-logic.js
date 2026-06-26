// V59 — Pure logic for "Đua Xe Đạp".
export const MAX_QUESTIONS = 24;
export const FINISH_LINE = 100;
export const STAMINA_MAX = 5;
export const GEAR_SLOW = 2;
export const GEAR_NORMAL = 6;
export const GEAR_FAST = 12;
export const MID_STREAK = 2;
export const FAST_STREAK = 4;
export const TIMER_SECONDS = 22;

export function getSpeed(streak, stamina) {
  if (stamina <= 0) return GEAR_SLOW;
  if (streak >= FAST_STREAK) return GEAR_FAST;
  if (streak >= MID_STREAK) return GEAR_NORMAL + 2;
  return GEAR_NORMAL;
}

export function initState(opts = {}) {
  return {
    distance: 0,
    finishLine: opts.finishLine ?? FINISH_LINE,
    stamina: opts.stamina ?? STAMINA_MAX,
    maxStamina: opts.stamina ?? STAMINA_MAX,
    streak: 0,
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    outcome: 'racing',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state) {
  if (state.outcome !== 'racing') return state;
  const speed = getSpeed(state.streak, state.stamina);
  const distance = Math.min(state.finishLine, state.distance + speed);
  return finalize({
    ...state,
    distance,
    streak: state.streak + 1,
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'racing') return state;
  return finalize({
    ...state,
    stamina: Math.max(0, state.stamina - 1),
    streak: 0,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function isFinished(state) {
  return state.outcome !== 'racing';
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
  if (state.distance >= state.finishLine) {
    return { ...state, outcome: 'won' };
  }
  if (state.questionsServed >= state.maxQuestions) {
    return { ...state, outcome: 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V59Logic = {
    MAX_QUESTIONS, FINISH_LINE, STAMINA_MAX,
    GEAR_SLOW, GEAR_NORMAL, GEAR_FAST, MID_STREAK, FAST_STREAK, TIMER_SECONDS, getSpeed,
    initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
  };
}
