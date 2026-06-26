// V52 — Pure logic for "Lễ Hội Trung Thu".
export const MAX_QUESTIONS = 22;
export const LANTERN_COUNT = 12;
export const WIN_THRESHOLD = 7;
export const FIREWORK_STREAK = 4;
export const TIMER_SECONDS = 22;

export const LANTERN_COLORS = ['red', 'orange', 'yellow', 'pink', 'cyan'];
export const FIREWORK_EMOJIS = ['🎆', '🎇', '✨'];

export function initState(opts = {}) {
  const slots = [];
  for (let i = 0; i < LANTERN_COUNT; i++) slots.push({ lit: false, color: null });
  return {
    slots,
    litCount: 0,
    streak: 0,
    fireworks: [],
    winThreshold: opts.winThreshold ?? WIN_THRESHOLD,
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    outcome: 'celebrating',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state, opts = {}) {
  if (state.outcome !== 'celebrating') return state;
  const rng = opts.rng ?? Math.random;
  const slots = state.slots.slice();
  const idx = slots.findIndex((s) => !s.lit);
  let litCount = state.litCount;
  if (idx !== -1) {
    const color = LANTERN_COLORS[Math.floor(rng() * LANTERN_COLORS.length)] ?? LANTERN_COLORS[0];
    slots[idx] = { lit: true, color };
    litCount += 1;
  }
  const streak = state.streak + 1;
  const fireworks = state.fireworks.slice();
  if (streak > 0 && streak % FIREWORK_STREAK === 0) {
    const fw = FIREWORK_EMOJIS[Math.floor(rng() * FIREWORK_EMOJIS.length)] ?? FIREWORK_EMOJIS[0];
    fireworks.push(fw);
  }
  return finalize({
    ...state,
    slots,
    litCount,
    streak,
    fireworks,
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'celebrating') return state;
  return finalize({
    ...state,
    streak: 0,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function isFinished(state) {
  return state.outcome !== 'celebrating';
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
  if (state.litCount >= state.slots.length) {
    return { ...state, outcome: 'won' };
  }
  if (state.questionsServed >= state.maxQuestions) {
    const won = state.litCount >= state.winThreshold;
    return { ...state, outcome: won ? 'won' : 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V52Logic = {
    MAX_QUESTIONS, LANTERN_COUNT, WIN_THRESHOLD, FIREWORK_STREAK, TIMER_SECONDS, LANTERN_COLORS, FIREWORK_EMOJIS,
    initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
  };
}
