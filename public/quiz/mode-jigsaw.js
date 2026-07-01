// Quiz mode: "🧩 Ghép Mảnh" — the correct answer is split into 2-3 puzzle
// pieces scattered around; the child taps pieces in order to assemble the answer.
// Wrong answers are shown as single-piece distractors.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('jigsaw', {
    weight: 1.0,
    canUse(q) {
      // Only for answers long enough to split (3+ chars) and with 3+ options
      const ct = window.HocVuiQuiz.helpers.correctText(q);
      return ct.length >= 3 && window.HocVuiQuiz.helpers.optionList(q).length >= 3;
    },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const correct = helpers.correctText(q);
      const ck = helpers.correctKey(q);

      const field = helpers.el('div', 'qz-jigsaw-field');
      optionsEl.appendChild(field);

      // Split correct answer into 2-3 pieces
      const pieces = splitText(correct);

      // Get 2 wrong answers as distractors (single pieces)
      const wrongs = helpers.shuffle(helpers.wrongList(q)).slice(0, 2).map(o => o.text);

      // Assembly zone (where pieces land)
      const assembly = helpers.el('div', 'qz-jigsaw-assembly');
      assembly.innerHTML = '<span class="qz-jigsaw-placeholder">' + pieces.map(() => '▢').join(' ') + '</span>';
      field.appendChild(assembly);

      // Scatter all pieces (correct parts + distractor parts)
      const allPieces = [];
      pieces.forEach((txt, i) => { allPieces.push({ txt, correct: true, idx: i }); });
      wrongs.forEach(txt => { allPieces.push({ txt: txt.slice(0, Math.ceil(txt.length / 2)), correct: false, idx: -1 }); });
      const shuffled = helpers.shuffle(allPieces);

      const pieceRow = helpers.el('div', 'qz-jigsaw-pieces');
      let collected = [];
      let done = false;

      shuffled.forEach(p => {
        const chip = helpers.el('button', 'option-btn qz-jigsaw-chip', p.txt);
        chip.dataset.correct = p.correct ? '1' : '0';
        chip.dataset.idx = String(p.idx);
        chip.addEventListener('click', () => {
          if (done) return;
          if (!p.correct) {
            // Wrong piece — shake and mark
            chip.classList.add('wrong');
            done = true;
            // Show correct assembled
            assembly.innerHTML = '<span class="qz-jigsaw-done wrong">' + collected.map(c => c.txt).join('') + '<b>' + p.txt + '</b>?</span>';
            pieceRow.querySelectorAll('.qz-jigsaw-chip').forEach(c => c.classList.add('disabled'));
            showCorrect();
            finish(false, collected.map(c => c.txt).join('') + p.txt);
            return;
          }
          // Correct piece — check order
          if (p.idx === collected.length) {
            collected.push(p);
            chip.classList.add('correct', 'placed');
            assembly.innerHTML = '<span class="qz-jigsaw-done">' + collected.map(c => c.txt).join('') + (collected.length < pieces.length ? ' ▢'.repeat(pieces.length - collected.length) : '') + '</span>';
            if (collected.length === pieces.length) {
              done = true;
              pieceRow.querySelectorAll('.qz-jigsaw-chip').forEach(c => c.classList.add('disabled'));
              assembly.querySelector('.qz-jigsaw-done').classList.add('complete');
              finish(true, correct);
            }
          } else {
            // Right answer but wrong order — hint shake
            chip.classList.add('shake');
            setTimeout(() => chip.classList.remove('shake'), 400);
          }
        });
        pieceRow.appendChild(chip);
      });
      field.appendChild(pieceRow);

      function showCorrect() {
        setTimeout(() => {
          assembly.innerHTML = '<span class="qz-jigsaw-done correct">👉 ' + correct + '</span>';
        }, 600);
      }

      ctx.onReveal(() => {
        done = true;
        pieceRow.querySelectorAll('.qz-jigsaw-chip').forEach(c => c.classList.add('disabled'));
        assembly.innerHTML = '<span class="qz-jigsaw-done correct">👉 ' + correct + '</span>';
      });
    },
  });

  function splitText(text) {
    const len = text.length;
    if (len <= 4) return [text.slice(0, Math.ceil(len / 2)), text.slice(Math.ceil(len / 2))];
    const n = len >= 7 ? 3 : 2;
    const size = Math.ceil(len / n);
    const parts = [];
    for (let i = 0; i < len; i += size) parts.push(text.slice(i, i + size));
    return parts;
  }
})();
