// V60 — Pure logic for "Cổ Tích Việt Nam".
export const MAX_QUESTIONS = 26;
export const STORIES_GOAL = 3;
export const CHAPTERS_PER_STORY = 4;
export const MORAL_STREAK = 4;
export const TIMER_SECONDS = 22;

export const TALES = [
  { id: 'tam_cam',   emoji: '👠', name: 'Tấm Cám',                    moral: 'Ở hiền gặp lành' },
  { id: 'so_dua',    emoji: '🥥', name: 'Sọ Dừa',                     moral: 'Đừng trông mặt mà bắt hình dong' },
  { id: 'con_rong',  emoji: '🐉', name: 'Con Rồng Cháu Tiên',         moral: 'Đoàn kết là sức mạnh' },
  { id: 'thanh_giong', emoji: '🐴', name: 'Thánh Gióng',              moral: 'Yêu nước, dũng cảm' },
  { id: 'cay_khe',   emoji: '🌳', name: 'Cây Khế',                    moral: 'Tham thì thâm' },
  { id: 'banh_chung', emoji: '🍚', name: 'Bánh Chưng Bánh Dày',       moral: 'Trân trọng giá trị truyền thống' },
];

export function initState(opts = {}) {
  return {
    chapters: 0,
    chaptersPerStory: CHAPTERS_PER_STORY,
    storiesDone: [],
    storiesGoal: opts.storiesGoal ?? STORIES_GOAL,
    morals: [],
    streak: 0,
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    outcome: 'reading',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state, opts = {}) {
  if (state.outcome !== 'reading') return state;
  const rng = opts.rng ?? Math.random;
  let chapters = state.chapters + 1;
  const storiesDone = state.storiesDone.slice();
  const morals = state.morals.slice();
  const streak = state.streak + 1;
  if (chapters >= state.chaptersPerStory) {
    // Pick a tale not yet completed
    const remaining = TALES.filter((t) => !storiesDone.find((s) => s.id === t.id));
    const tale = remaining[Math.floor(rng() * remaining.length)] ?? TALES[storiesDone.length % TALES.length];
    storiesDone.push(tale);
    chapters = 0;
  }
  if (streak > 0 && streak % MORAL_STREAK === 0) {
    const remaining = TALES.filter((t) => !morals.find((m) => m.id === t.id));
    const m = remaining[Math.floor(rng() * remaining.length)] ?? TALES[morals.length % TALES.length];
    morals.push({ id: m.id, text: m.moral });
  }
  return finalize({
    ...state,
    chapters,
    storiesDone,
    morals,
    streak,
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'reading') return state;
  return finalize({
    ...state,
    chapters: Math.max(0, state.chapters - 1),
    streak: 0,
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function isFinished(state) {
  return state.outcome !== 'reading';
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
  if (state.storiesDone.length >= state.storiesGoal) {
    return { ...state, outcome: 'won' };
  }
  if (state.questionsServed >= state.maxQuestions) {
    return { ...state, outcome: 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V60Logic = {
    MAX_QUESTIONS, STORIES_GOAL, CHAPTERS_PER_STORY, MORAL_STREAK, TIMER_SECONDS, TALES,
    initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
  };
}
