// V55 — Pure logic for "Sân Bóng Trí Tuệ".
export const MAX_QUESTIONS = 22;
export const GOALS_TO_WIN = 5;
export const GOALS_TO_LOSE = 3;
export const BASE_SHOT_RATE = 0.5;
export const MID_SHOT_RATE = 0.75;
export const BOOST_SHOT_RATE = 0.95;
export const MID_STREAK = 2;
export const BOOST_STREAK = 4;
export const OPPONENT_SHOT_RATE = 0.35;
export const TIMER_SECONDS = 22;

export function getShotRate(streak) {
  if (streak >= BOOST_STREAK) return BOOST_SHOT_RATE;
  if (streak >= MID_STREAK) return MID_SHOT_RATE;
  return BASE_SHOT_RATE;
}

export function initState(opts = {}) {
  return {
    myGoals: 0,
    oppGoals: 0,
    shots: 0,
    streak: 0,
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    outcome: 'playing',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state, opts = {}) {
  if (state.outcome !== 'playing') return state;
  const rng = opts.rng ?? Math.random;
  const rate = getShotRate(state.streak);
  const roll = rng();
  const goal = roll < rate;
  return finalize({
    ...state,
    myGoals: goal ? state.myGoals + 1 : state.myGoals,
    shots: state.shots + 1,
    streak: state.streak + 1,
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function applyWrongOrTimeout(state, opts = {}) {
  if (state.outcome !== 'playing') return state;
  const rng = opts.rng ?? Math.random;
  const oppGoal = rng() < OPPONENT_SHOT_RATE;
  return finalize({
    ...state,
    oppGoals: oppGoal ? state.oppGoals + 1 : state.oppGoals,
    streak: 0,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function isFinished(state) {
  return state.outcome !== 'playing';
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
  if (state.myGoals >= GOALS_TO_WIN) {
    return { ...state, outcome: 'won' };
  }
  if (state.oppGoals >= GOALS_TO_LOSE) {
    return { ...state, outcome: 'lost' };
  }
  if (state.questionsServed >= state.maxQuestions) {
    if (state.myGoals > state.oppGoals) return { ...state, outcome: 'won' };
    if (state.myGoals < state.oppGoals) return { ...state, outcome: 'lost' };
    return { ...state, outcome: 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V55Logic = {
    MAX_QUESTIONS, GOALS_TO_WIN, GOALS_TO_LOSE,
    BASE_SHOT_RATE, MID_SHOT_RATE, BOOST_SHOT_RATE, MID_STREAK, BOOST_STREAK,
    OPPONENT_SHOT_RATE, TIMER_SECONDS, getShotRate,
    initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
  };
}
