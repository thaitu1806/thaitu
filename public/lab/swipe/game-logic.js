// Lab / Swipe — pure logic. Turns a question into a True/False statement card.
// For math "a + b = ?" style we render "a + b = X" where X is either the correct
// answer (truthy) or a wrong option (falsy). For other subjects we phrase it as
// "<question> → <answer>" and ask whether the shown answer is correct.
(function (root) {
  'use strict';

  function correctText(q) {
    const k = 'option_' + String(q.correct_answer || '').toLowerCase();
    return q[k] != null ? String(q[k]) : '';
  }
  function wrongTexts(q) {
    const correct = String(q.correct_answer || '').toLowerCase();
    return ['a', 'b', 'c', 'd']
      .filter(k => k !== correct)
      .map(k => q['option_' + k])
      .filter(v => v != null && String(v).trim() !== '')
      .map(String);
  }

  // Build a statement card. rng for testability; `wantTrue` forces the truth value.
  function buildCard(q, opts) {
    opts = opts || {};
    const rng = opts.rng || Math.random;
    const correct = correctText(q);
    const wrongs = wrongTexts(q);
    // Decide whether this card is a TRUE statement.
    let isTrue = opts.wantTrue != null ? !!opts.wantTrue : rng() < 0.5;
    if (!isTrue && wrongs.length === 0) isTrue = true; // no distractor → must be true
    const shown = isTrue ? correct : wrongs[Math.floor(rng() * wrongs.length)];
    const qText = (q.question_text || '').trim();
    // If the question ends with "= ?" make it "= shown"; else "question → shown".
    let statement;
    if (/=\s*\?\s*$/.test(qText)) statement = qText.replace(/=\s*\?\s*$/, '= ' + shown);
    else if (/\?\s*$/.test(qText)) statement = qText + '  →  ' + shown;
    else statement = qText + '  →  ' + shown;
    return { statement, isTrue, shown, correct };
  }

  // answeredTrue = player said "ĐÚNG". Correct when it matches the card truth.
  function judge(card, answeredTrue) { return card.isTrue === !!answeredTrue; }

  function starsFor(total, correct) {
    if (total <= 0) return 0;
    const acc = correct / total;
    if (acc >= 0.9) return 3;
    if (acc >= 0.65) return 2;
    if (acc >= 0.4) return 1;
    return 0;
  }

  const API = { correctText, wrongTexts, buildCard, judge, starsFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.LabSwipeLogic = API;
})(typeof window !== 'undefined' ? window : null);
