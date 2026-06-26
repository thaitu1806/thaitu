// V50 — Pure logic for "Tàu Ngầm Đại Dương".
export const MAX_QUESTIONS = 24;
export const MAX_DEPTH = 10;
export const OXYGEN_START = 6;
export const TREASURE_COMBO = 3;
export const TIMER_SECONDS = 22;

export const ZONE_AT = (depth) => {
  if (depth < 3) return { id: 'shallow', emoji: '🏝️', name: 'Vùng nông' };
  if (depth < 6) return { id: 'reef',    emoji: '🐠', name: 'Rạn san hô' };
  if (depth < 9) return { id: 'deep',    emoji: '🐙', name: 'Vực sâu' };
  return { id: 'abyss',  emoji: '🐋', name: 'Đại dương sâu thẳm' };
};

export const TREASURE_EMOJIS = ['💎', '👑', '🏆', '⚓', '🐚', '🦀'];

export function initState(opts = {}) {
  return {
    depth: 0,
    maxDepth: opts.maxDepth ?? MAX_DEPTH,
    oxygen: opts.oxygen ?? OXYGEN_START,
    maxOxygen: opts.oxygen ?? OXYGEN_START,
    comboRun: 0,
    treasures: [],
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    outcome: 'diving',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state, opts = {}) {
  if (state.outcome !== 'diving') return state;
  const rng = opts.rng ?? Math.random;
  const depth = Math.min(state.maxDepth, state.depth + 1);
  const comboRun = state.comboRun + 1;
  const treasures = state.treasures.slice();
  if (comboRun > 0 && comboRun % TREASURE_COMBO === 0) {
    const emoji = TREASURE_EMOJIS[Math.floor(rng() * TREASURE_EMOJIS.length)] ?? TREASURE_EMOJIS[0];
    treasures.push({ emoji, atDepth: depth });
  }
  return finalize({
    ...state,
    depth,
    comboRun,
    treasures,
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'diving') return state;
  return finalize({
    ...state,
    oxygen: Math.max(0, state.oxygen - 1),
    comboRun: 0,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function isFinished(state) {
  return state.outcome !== 'diving';
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
  if (state.depth >= state.maxDepth) {
    return { ...state, outcome: 'won' };
  }
  if (state.oxygen <= 0) {
    return { ...state, outcome: 'surfaced' };
  }
  if (state.questionsServed >= state.maxQuestions) {
    return { ...state, outcome: 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V50Logic = {
    MAX_QUESTIONS, MAX_DEPTH, OXYGEN_START, TREASURE_COMBO, TIMER_SECONDS, TREASURE_EMOJIS, ZONE_AT,
    initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
  };
}
