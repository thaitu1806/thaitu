// V54 — Pure logic for "Phù Thủy Thuốc".
export const MAX_QUESTIONS = 22;
export const POTIONS_GOAL = 5;
export const INGREDIENTS_PER_POTION = 3;
export const LEGENDARY_STREAK = 5;
export const TIMER_SECONDS = 22;

export const INGREDIENT_COLORS = ['red', 'green', 'blue', 'purple', 'gold'];
export const INGREDIENT_EMOJIS = {
  red: '🍓', green: '🌿', blue: '💧', purple: '🍇', gold: '🌟',
};
export const POTION_EMOJI = '🧪';
export const LEGENDARY_EMOJI = '⚗️';

export function initState(opts = {}) {
  return {
    cauldron: { color: null, count: 0 },
    potions: [],
    potionsGoal: opts.potionsGoal ?? POTIONS_GOAL,
    streak: 0,
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    outcome: 'brewing',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state, opts = {}) {
  if (state.outcome !== 'brewing') return state;
  const rng = opts.rng ?? Math.random;
  let cauldron = { ...state.cauldron };
  if (cauldron.color == null) {
    cauldron.color = INGREDIENT_COLORS[Math.floor(rng() * INGREDIENT_COLORS.length)] ?? INGREDIENT_COLORS[0];
    cauldron.count = 1;
  } else {
    cauldron.count += 1;
  }
  const streak = state.streak + 1;
  const potions = state.potions.slice();
  if (cauldron.count >= INGREDIENTS_PER_POTION) {
    const legendary = streak >= LEGENDARY_STREAK;
    potions.push({ color: cauldron.color, legendary });
    cauldron = { color: null, count: 0 };
  }
  return finalize({
    ...state,
    cauldron,
    potions,
    streak,
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'brewing') return state;
  return finalize({
    ...state,
    cauldron: { color: null, count: 0 },
    streak: 0,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function isFinished(state) {
  return state.outcome !== 'brewing';
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
  if (state.potions.length >= state.potionsGoal) {
    return { ...state, outcome: 'won' };
  }
  if (state.questionsServed >= state.maxQuestions) {
    return { ...state, outcome: 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V54Logic = {
    MAX_QUESTIONS, POTIONS_GOAL, INGREDIENTS_PER_POTION, LEGENDARY_STREAK, TIMER_SECONDS,
    INGREDIENT_COLORS, INGREDIENT_EMOJIS, POTION_EMOJI, LEGENDARY_EMOJI,
    initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
  };
}
