// Lab / Match — pure logic (no DOM, no fetch). Builds "match pairs" rounds from
// a pool of questions. Each pair = { id, left (question), right (correct answer) }.
// Exposed on window.LabMatchLogic and as CommonJS for tests.
(function (root) {
  'use strict';

  function shuffle(arr, rng) {
    const a = arr.slice();
    const rand = rng || Math.random;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Extract the correct-answer text from a question object.
  function correctText(q) {
    const key = 'option_' + String(q.correct_answer || '').toLowerCase();
    return q[key] != null ? String(q[key]) : '';
  }

  // Build one round of `size` pairs from the question pool starting at `offset`.
  // Skips questions whose correct answer text is empty or duplicates within the
  // round (so two rights are never identical → unambiguous matching).
  function buildRound(questions, size, offset) {
    const pairs = [];
    const usedRight = new Set();
    let i = offset || 0;
    while (pairs.length < size && i < questions.length) {
      const q = questions[i++];
      const right = correctText(q);
      const left = (q.question_text || '').trim();
      if (!right || !left) continue;
      if (usedRight.has(right.toLowerCase())) continue;
      usedRight.add(right.toLowerCase());
      pairs.push({ id: q.id != null ? q.id : ('p' + pairs.length), left, right, question: q });
    }
    return { pairs, nextOffset: i };
  }

  // Given a round's pairs, produce the two display columns. Left keeps order,
  // right is shuffled so positions don't line up.
  function makeColumns(pairs, rng) {
    const left = pairs.map(p => ({ pairId: p.id, text: p.left }));
    const right = shuffle(pairs.map(p => ({ pairId: p.id, text: p.right })), rng);
    return { left, right };
  }

  // Check whether a left selection and right selection belong to the same pair.
  function isMatch(leftPairId, rightPairId) {
    return leftPairId != null && leftPairId === rightPairId;
  }

  // Stars from accuracy: mistakes across the whole game.
  function starsFor(totalPairs, mistakes) {
    if (totalPairs <= 0) return 0;
    const ratio = mistakes / totalPairs;
    if (ratio <= 0.1) return 3;
    if (ratio <= 0.35) return 2;
    return 1;
  }

  const API = { shuffle, correctText, buildRound, makeColumns, isMatch, starsFor };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.LabMatchLogic = API;
})(typeof window !== 'undefined' ? window : null);
