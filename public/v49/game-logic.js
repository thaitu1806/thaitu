// V49 — Pure logic for "DJ Nhí".
export const MAX_QUESTIONS = 24;
export const TRACKS_TO_BUILD = 5;
export const BEATS_PER_TRACK = 4;
export const GROOVE_MAX = 4;
export const GROOVE_THRESHOLD = 3;
export const TIMER_SECONDS = 22;

export const TRACK_THEMES = [
  { id: 'pop',   emoji: '🎵', name: 'Pop' },
  { id: 'rock',  emoji: '🎸', name: 'Rock' },
  { id: 'hip',   emoji: '🎤', name: 'Hip-hop' },
  { id: 'edm',   emoji: '🎧', name: 'EDM' },
  { id: 'funky', emoji: '🥳', name: 'Funky' },
];

export function initState(opts = {}) {
  return {
    tracks: [],
    tracksGoal: opts.tracksGoal ?? TRACKS_TO_BUILD,
    currentBeats: 0,
    beatsPerTrack: BEATS_PER_TRACK,
    groove: 0,
    correct: 0,
    wrong: 0,
    questionsServed: 0,
    maxQuestions: opts.maxQuestions ?? MAX_QUESTIONS,
    outcome: 'mixing',
    startedAt: opts.startedAt ?? Date.now(),
  };
}

export function applyCorrect(state) {
  if (state.outcome !== 'mixing') return state;
  const beatsAdded = state.groove >= GROOVE_THRESHOLD ? 2 : 1;
  let beats = state.currentBeats + beatsAdded;
  const tracks = state.tracks.slice();
  while (beats >= state.beatsPerTrack && tracks.length < state.tracksGoal) {
    const theme = TRACK_THEMES[tracks.length % TRACK_THEMES.length];
    tracks.push({ ...theme, perfect: state.groove >= GROOVE_THRESHOLD });
    beats -= state.beatsPerTrack;
  }
  if (tracks.length >= state.tracksGoal) beats = 0;
  return finalize({
    ...state,
    tracks,
    currentBeats: beats,
    groove: Math.min(GROOVE_MAX, state.groove + 1),
    correct: state.correct + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function applyWrongOrTimeout(state) {
  if (state.outcome !== 'mixing') return state;
  return finalize({
    ...state,
    groove: Math.max(0, state.groove - 1),
    wrong: state.wrong + 1,
    questionsServed: state.questionsServed + 1,
  });
}

export function isFinished(state) {
  return state.outcome !== 'mixing';
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
  if (state.tracks.length >= state.tracksGoal) {
    return { ...state, outcome: 'won' };
  }
  if (state.questionsServed >= state.maxQuestions) {
    return { ...state, outcome: 'closed' };
  }
  return state;
}

if (typeof window !== 'undefined') {
  window.V49Logic = {
    MAX_QUESTIONS, TRACKS_TO_BUILD, BEATS_PER_TRACK, GROOVE_MAX, GROOVE_THRESHOLD, TIMER_SECONDS, TRACK_THEMES,
    initState, applyCorrect, applyWrongOrTimeout, isFinished, pickNextQuestion,
  };
}
