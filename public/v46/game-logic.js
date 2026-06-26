// V46 — Pure logic for "Tiệm Cây Cảnh".
export const TOTAL_POTS = 6;
export const MAX_QUESTIONS = 24;
export const MAX_STAGE = 4;
export const TIMER_SECONDS = 25;
export const STAGE_EMOJIS = ['⬜', '🌱', '🌿', '🌳', '🎋']; // index = stage

export const PLANT_SPECIES = [
  { id: 'cactus',  emoji: '🌵', name: 'Xương rồng' },
  { id: 'rose',    emoji: '🌹', name: 'Hoa hồng' },
  { id: 'tulip',   emoji: '🌷', name: 'Tulip' },
  { id: 'lotus',   emoji: '🌺', name: 'Sen' },
  { id: 'sunflower', emoji: '🌻', name: 'Hướng dương' },
  { id: 'bamboo',  emoji: '🎍', name: 'Tre' },
  { id: 'pine',    emoji: '🌲', name: 'Thông' },
  { id: 'maple',   emoji: '🍁', name: 'Phong' },
  { id: 'cherry',  emoji: '🌸', name: 'Anh đào' },
];

export function initState(opts = {}) {
  const rng = opts.rng ?? Math.random;
  const pots = [];
  for (let i = 0; i < TOTAL_POTS; i++) {
    pots.push({
      stage: 0,
      species: PLANT_SPECIES[Math.floor(rng() * PLANT_SPECIES.length)] ?? PLANT_SPECIES[0],
    });
  }
  return {
    totalPots: TOTAL_POTS,
    pots,
    selectedPotIndex: 0,
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    collectedCount: 0,
    outcome: 'tending',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state) {
  if (state.outcome !== 'tending') return state;
  const pots = state.pots.slice();
  const idx = pickGrowable(pots, state.selectedPotIndex);
  if (idx === -1) {
    return finalize({
      ...state,
      correct: state.correct + 1,
      questionsServed: state.questionsServed + 1,
    });
  }
  const next = { ...pots[idx], stage: Math.min(MAX_STAGE, pots[idx].stage + 1) };
  pots[idx] = next;
  const collectedCount = pots.filter((p) => p.stage === MAX_STAGE).length;
  return finalize({
    ...state,
    pots,
    selectedPotIndex: nextSelectable(pots, idx),
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
    collectedCount,
  });
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'tending') return state;
  return finalize({
    ...state,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function selectPot(state, idx) {
  if (idx < 0 || idx >= state.totalPots) return state;
  if (state.pots[idx].stage >= MAX_STAGE) return state;
  return { ...state, selectedPotIndex: idx };
}

export function isFinished(state) {
  return state.outcome === 'won' || state.outcome === 'closed';
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
function pickGrowable(pots, start) {
  for (let off = 0; off < pots.length; off++) {
    const i = (start + off) % pots.length;
    if (pots[i].stage < MAX_STAGE) return i;
  }
  return -1;
}

function nextSelectable(pots, currentIdx) {
  for (let off = 1; off <= pots.length; off++) {
    const i = (currentIdx + off) % pots.length;
    if (pots[i].stage < MAX_STAGE) return i;
  }
  return currentIdx;
}

function finalize(state) {
  if (state.collectedCount >= state.totalPots) {
    return { ...state, outcome: 'won' };
  }
  if (state.questionsServed >= state.maxQuestions && state.collectedCount < state.totalPots) {
    return { ...state, outcome: 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V46Logic = {
    TOTAL_POTS, MAX_QUESTIONS, MAX_STAGE, TIMER_SECONDS, STAGE_EMOJIS, PLANT_SPECIES,
    initState, applyCorrect, applyWrongOrTimeout, selectPot, isFinished, pickNextQuestion,
  };
}
