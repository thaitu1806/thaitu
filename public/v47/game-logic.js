// V47 — Pure logic for "Phòng Thí Nghiệm Slime".
export const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];
export const COLOR_EMOJIS = { red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', purple: '🟣' };
export const MAX_QUESTIONS = 20;
export const MAX_SLIMES = 6;
export const RARE_THRESHOLD = 5;
export const TIMER_SECONDS = 20;
export const CRAFT_DROPS = 3;

export function initState(opts = {}) {
  return {
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    slimesCrafted: 0,
    maxSlimes: opts.maxSlimes ?? MAX_SLIMES,
    slimes: [],
    jarColor: null,
    jarDrops: 0,
    comboRun: 0,
    correct: 0,
    wrong: 0,
    outcome: 'mixing',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state, opts = {}) {
  if (state.outcome !== 'mixing') return state;
  const rng = opts.rng ?? Math.random;

  let jarColor = state.jarColor;
  if (jarColor == null) {
    jarColor = COLORS[Math.floor(rng() * COLORS.length)] ?? COLORS[0];
  }
  const jarDrops = state.jarDrops + 1;
  const comboRun = state.comboRun + 1;
  const next = {
    ...state,
    questionsServed: state.questionsServed + 1,
    correct: state.correct + 1,
    jarColor,
    jarDrops,
    comboRun,
  };

  if (jarDrops >= CRAFT_DROPS) {
    const rare = comboRun >= RARE_THRESHOLD;
    return finalize({
      ...next,
      slimes: [...state.slimes, { color: jarColor, rare }],
      slimesCrafted: state.slimesCrafted + 1,
      jarColor: null,
      jarDrops: 0,
      comboRun: 0,
    });
  }

  return finalize(next);
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'mixing') return state;
  return finalize({
    ...state,
    questionsServed: state.questionsServed + 1,
    wrong: state.wrong + 1,
    jarColor: null,
    jarDrops: 0,
    comboRun: 0,
  });
}

export function isFinished(state) {
  return state.outcome === 'closed';
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
  if (state.slimesCrafted >= state.maxSlimes || state.questionsServed >= state.maxQuestions) {
    return { ...state, outcome: 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V47Logic = {
    COLORS, COLOR_EMOJIS, MAX_QUESTIONS, MAX_SLIMES, RARE_THRESHOLD, TIMER_SECONDS, CRAFT_DROPS,
    initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
  };
}
