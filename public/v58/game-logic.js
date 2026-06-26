// V58 — Pure logic for "Hành Trình Lúa Gạo".
export const MAX_QUESTIONS = 24;
export const CYCLES_GOAL = 5;
export const STAGES_PER_CYCLE = 4; // seed → sprout → grain → harvest
export const BONUS_STREAK = 4;
export const TIMER_SECONDS = 22;

export const STAGES = ['🌱', '🌾', '🌾', '🍚']; // visual progression per stage
export const STAGE_NAMES = ['Gieo hạt', 'Nảy mầm', 'Đơm bông', 'Thu hoạch'];

export function initState(opts = {}) {
  return {
    cycles: 0,
    cyclesGoal: opts.cyclesGoal ?? CYCLES_GOAL,
    stage: 0,
    stagesPerCycle: STAGES_PER_CYCLE,
    bushels: 0,
    bonusCycles: 0,
    streak: 0,
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    outcome: 'farming',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state) {
  if (state.outcome !== 'farming') return state;
  let stage = state.stage + 1;
  let cycles = state.cycles;
  let bushels = state.bushels;
  let bonusCycles = state.bonusCycles;
  const streak = state.streak + 1;
  if (stage >= state.stagesPerCycle) {
    const bonus = streak >= BONUS_STREAK;
    bushels += bonus ? 2 : 1;
    if (bonus) bonusCycles += 1;
    cycles += 1;
    stage = 0;
  }
  return finalize({
    ...state,
    stage,
    cycles,
    bushels,
    bonusCycles,
    streak,
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'farming') return state;
  return finalize({
    ...state,
    stage: Math.max(0, state.stage - 1),
    streak: 0,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function isFinished(state) {
  return state.outcome !== 'farming';
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
  if (state.cycles >= state.cyclesGoal) {
    return { ...state, outcome: 'won' };
  }
  if (state.questionsServed >= state.maxQuestions) {
    return { ...state, outcome: 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V58Logic = {
    MAX_QUESTIONS, CYCLES_GOAL, STAGES_PER_CYCLE, BONUS_STREAK, TIMER_SECONDS, STAGES, STAGE_NAMES,
    initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
  };
}
