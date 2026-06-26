// V56 — Pure logic for "Người Tuyết Cứu Bắc Cực".
export const MAX_QUESTIONS = 24;
export const SNOWMEN_GOAL = 8;
export const PIECES_PER_SNOWMAN = 3;
export const TIMER_SECONDS = 22;

export const ACCESSORIES = ['🧣', '🎩', '🥕', '🧤', '👒'];

export function initState(opts = {}) {
  return {
    snowmen: [],
    snowmenGoal: opts.snowmenGoal ?? SNOWMEN_GOAL,
    currentPieces: 0,
    piecesPerSnowman: PIECES_PER_SNOWMAN,
    streak: 0,
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    outcome: 'building',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state, opts = {}) {
  if (state.outcome !== 'building') return state;
  const rng = opts.rng ?? Math.random;
  let currentPieces = state.currentPieces + 1;
  const snowmen = state.snowmen.slice();
  if (currentPieces >= state.piecesPerSnowman) {
    const accessory = ACCESSORIES[Math.floor(rng() * ACCESSORIES.length)] ?? ACCESSORIES[0];
    snowmen.push({ accessory });
    currentPieces = 0;
  }
  return finalize({
    ...state,
    snowmen,
    currentPieces,
    streak: state.streak + 1,
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'building') return state;
  return finalize({
    ...state,
    currentPieces: Math.max(0, state.currentPieces - 1),
    streak: 0,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function isFinished(state) {
  return state.outcome !== 'building';
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
  if (state.snowmen.length >= state.snowmenGoal) {
    return { ...state, outcome: 'won' };
  }
  if (state.questionsServed >= state.maxQuestions) {
    return { ...state, outcome: 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V56Logic = {
    MAX_QUESTIONS, SNOWMEN_GOAL, PIECES_PER_SNOWMAN, TIMER_SECONDS, ACCESSORIES,
    initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
  };
}
