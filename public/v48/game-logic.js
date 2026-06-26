// V48 — Pure logic for "Cứu Hộ Khủng Long".
export const MAX_QUESTIONS = 22;
export const TOTAL_DINOS = 8;
export const DANGER_MAX = 5;
export const COMBO_BONUS = 3;
export const TIMER_SECONDS = 22;

export const DINO_SPECIES = [
  { id: 'trex',         emoji: '🦖', name: 'T-Rex' },
  { id: 'brachio',      emoji: '🦕', name: 'Brachio' },
  { id: 'dragon',       emoji: '🐉', name: 'Long' },
  { id: 'raptor',       emoji: '🦎', name: 'Velociraptor' },
  { id: 'egg',          emoji: '🥚', name: 'Trứng Khủng Long' },
  { id: 'croco',        emoji: '🐊', name: 'Croco' },
  { id: 'serpent',      emoji: '🐲', name: 'Đầu Rồng' },
  { id: 'stego',        emoji: '🦴', name: 'Stego' },
  { id: 'pterodactyl',  emoji: '🦅', name: 'Dực Long' },
  { id: 'ankylo',       emoji: '🦔', name: 'Khiên Long' },
  { id: 'triceratops',  emoji: '🦏', name: 'Tê Long' },
  { id: 'spinosaurus',  emoji: '🐟', name: 'Vây Long' },
  { id: 'mosasaur',     emoji: '🐋', name: 'Hải Long' },
  { id: 'paraloph',     emoji: '🦒', name: 'Mào Long' },
  { id: 'baby',         emoji: '🐣', name: 'Khủng Long Con' },
  { id: 'compy',        emoji: '🐦', name: 'Tiểu Long' },
];

export function initState(opts = {}) {
  // Shuffle the pool and pick TOTAL_DINOS species for variety each run.
  const pool = DINO_SPECIES.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const dinos = pool.slice(0, TOTAL_DINOS).map((s) => ({ ...s, rescued: false }));
  return {
    dinos,
    rescuedCount: 0,
    totalDinos: TOTAL_DINOS,
    danger: 0,
    maxDanger: DANGER_MAX,
    comboRun: 0,
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    outcome: 'rescuing',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state) {
  if (state.outcome !== 'rescuing') return state;
  const dinos = state.dinos.slice();
  let rescuedDelta = rescueNext(dinos);
  const comboRun = state.comboRun + 1;
  // bonus rescue every COMBO_BONUS in a row
  if (comboRun > 0 && comboRun % COMBO_BONUS === 0) {
    rescuedDelta += rescueNext(dinos);
  }
  const rescuedCount = state.rescuedCount + rescuedDelta;
  return finalize({
    ...state,
    dinos,
    rescuedCount,
    comboRun,
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'rescuing') return state;
  return finalize({
    ...state,
    danger: state.danger + 1,
    comboRun: 0,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function isFinished(state) {
  return state.outcome !== 'rescuing';
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

// helpers ─────────────────────────────────────────────────────────────────
function rescueNext(dinos) {
  for (let i = 0; i < dinos.length; i++) {
    if (!dinos[i].rescued) { dinos[i] = { ...dinos[i], rescued: true }; return 1; }
  }
  return 0;
}

function finalize(state) {
  if (state.rescuedCount >= state.totalDinos) {
    return { ...state, outcome: 'won' };
  }
  if (state.danger >= state.maxDanger) {
    return { ...state, outcome: 'erupted' };
  }
  if (state.questionsServed >= state.maxQuestions) {
    return { ...state, outcome: 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V48Logic = {
    MAX_QUESTIONS, TOTAL_DINOS, DANGER_MAX, COMBO_BONUS, TIMER_SECONDS, DINO_SPECIES,
    initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
  };
}
