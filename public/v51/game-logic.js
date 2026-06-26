// V51 — Pure logic for "Vườn Thú Pokémon Việt".
export const MAX_QUESTIONS = 24;
export const TOTAL_SPECIES = 8;
export const STREAK_FOR_BOOST = 3;
export const BASE_CATCH_RATE = 0.55;
export const BOOST_CATCH_RATE = 0.9;
export const TIMER_SECONDS = 22;

export const SPECIES = [
  { id: 'turtle',  emoji: '🐢', name: 'Rùa Vàng',   rarity: 1 },
  { id: 'frog',    emoji: '🐸', name: 'Ếch Cốm',    rarity: 1 },
  { id: 'cat',     emoji: '🐱', name: 'Miu Mèo',    rarity: 1 },
  { id: 'fox',     emoji: '🦊', name: 'Cáo Lửa',    rarity: 2 },
  { id: 'panda',   emoji: '🐼', name: 'Gấu Trúc',   rarity: 2 },
  { id: 'koala',   emoji: '🐨', name: 'Koala',      rarity: 2 },
  { id: 'dragon',  emoji: '🐲', name: 'Long Tinh',  rarity: 3 },
  { id: 'unicorn', emoji: '🦄', name: 'Kỳ Lân',     rarity: 3 },
];

export function initState(opts = {}) {
  return {
    captured: [],       // array of species ids in capture order
    capturedSet: [],    // mirror for testing (Set semantics impossible to serialize cleanly)
    totalSpecies: TOTAL_SPECIES,
    streak: 0,
    attempts: 0,
    catches: 0,
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    outcome: 'hunting',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state, opts = {}) {
  if (state.outcome !== 'hunting') return state;
  const rng = opts.rng ?? Math.random;
  const target = pickWild(state.captured, rng);
  const streak = state.streak + 1;
  const rate = streak >= STREAK_FOR_BOOST ? BOOST_CATCH_RATE : BASE_CATCH_RATE;
  const roll = rng();
  const caught = roll < rate;
  const captured = caught && target ? [...state.captured, target.id] : state.captured;
  return finalize({
    ...state,
    captured,
    capturedSet: captured,
    streak,
    attempts: state.attempts + 1,
    catches: caught && target ? state.catches + 1 : state.catches,
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'hunting') return state;
  return finalize({
    ...state,
    streak: 0,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function isFinished(state) {
  return state.outcome !== 'hunting';
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

function pickWild(captured, rng) {
  const remaining = SPECIES.filter((s) => !captured.includes(s.id));
  if (remaining.length === 0) return null;
  // weight inversely by rarity so common appear more often
  const weighted = remaining.flatMap((s) => Array(4 - s.rarity).fill(s));
  return weighted[Math.floor(rng() * weighted.length)] ?? remaining[0];
}

function finalize(state) {
  if (state.captured.length >= state.totalSpecies) {
    return { ...state, outcome: 'won' };
  }
  if (state.questionsServed >= state.maxQuestions) {
    return { ...state, outcome: 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V51Logic = {
    MAX_QUESTIONS, TOTAL_SPECIES, STREAK_FOR_BOOST, BASE_CATCH_RATE, BOOST_CATCH_RATE, TIMER_SECONDS, SPECIES,
    initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
  };
}
