// Lab / Pop — pure logic (no DOM). Turns a question into a "round": the correct
// answer text + up to 3 distractor option texts, shuffled into floating bubbles.
(function (root) {
  'use strict';

  function shuffle(arr, rng) {
    const a = arr.slice(); const rand = rng || Math.random;
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function correctText(q) {
    const k = 'option_' + String(q.correct_answer || '').toLowerCase();
    return q[k] != null ? String(q[k]) : '';
  }

  // Build the set of bubble choices for a question: the correct option plus the
  // other 3 options (deduped). Marks which is correct.
  function buildChoices(q, rng) {
    const correct = correctText(q);
    const all = ['a', 'b', 'c', 'd']
      .map(k => q['option_' + k])
      .filter(v => v != null && String(v).trim() !== '')
      .map(String);
    const uniq = [];
    const seen = new Set();
    for (const v of all) { const key = v.toLowerCase(); if (!seen.has(key)) { seen.add(key); uniq.push(v); } }
    // ensure the correct one is present
    if (!uniq.some(v => v === correct) && correct) uniq.unshift(correct);
    const choices = shuffle(uniq, rng).map(text => ({ text, correct: text === correct }));
    return choices;
  }

  function starsFor(total, correct) {
    if (total <= 0) return 0;
    const acc = correct / total;
    if (acc >= 0.9) return 3;
    if (acc >= 0.6) return 2;
    if (acc >= 0.3) return 1;
    return 0;
  }

  const API = { shuffle, correctText, buildChoices, starsFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.LabPopLogic = API;
})(typeof window !== 'undefined' ? window : null);
