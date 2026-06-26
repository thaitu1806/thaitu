// V57 — Pure logic for "Tiệm May Áo Dài".
export const MAX_QUESTIONS = 24;
export const GARMENTS_GOAL = 5;
export const PANELS_PER_GARMENT = 4;
export const GOLD_STREAK = 5;
export const TIMER_SECONDS = 22;

export const AO_DAI_COLORS = [
  { id: 'red',    emoji: '👘', name: 'Đỏ truyền thống' },
  { id: 'pink',   emoji: '🌸', name: 'Hồng cánh sen' },
  { id: 'gold',   emoji: '🌼', name: 'Vàng nhụy hoa' },
  { id: 'blue',   emoji: '💙', name: 'Xanh ngọc' },
  { id: 'white',  emoji: '🤍', name: 'Trắng tinh khôi' },
];

export function initState(opts = {}) {
  return {
    garments: [],
    garmentsGoal: opts.garmentsGoal ?? GARMENTS_GOAL,
    panels: 0,
    panelsPerGarment: PANELS_PER_GARMENT,
    streak: 0,
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    outcome: 'sewing',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state, opts = {}) {
  if (state.outcome !== 'sewing') return state;
  const rng = opts.rng ?? Math.random;
  let panels = state.panels + 1;
  const streak = state.streak + 1;
  const garments = state.garments.slice();
  if (panels >= state.panelsPerGarment) {
    const color = AO_DAI_COLORS[Math.floor(rng() * AO_DAI_COLORS.length)] ?? AO_DAI_COLORS[0];
    garments.push({ ...color, gold: streak >= GOLD_STREAK });
    panels = 0;
  }
  return finalize({
    ...state,
    garments,
    panels,
    streak,
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'sewing') return state;
  return finalize({
    ...state,
    panels: 0,
    streak: 0,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function isFinished(state) {
  return state.outcome !== 'sewing';
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
  if (state.garments.length >= state.garmentsGoal) {
    return { ...state, outcome: 'won' };
  }
  if (state.questionsServed >= state.maxQuestions) {
    return { ...state, outcome: 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V57Logic = {
    MAX_QUESTIONS, GARMENTS_GOAL, PANELS_PER_GARMENT, GOLD_STREAK, TIMER_SECONDS, AO_DAI_COLORS,
    initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
  };
}
