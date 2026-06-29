// Quiz mode: "Loại bỏ" — reverse thinking. Asks the child to tap the option that
// is NOT a valid / not-the answer. We show the correct answer plus wrongs and ask
// to find a WRONG one (any wrong = success). Needs >=2 wrong options.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('eliminate', {
    weight: 0.5,
    canUse(q) {
      const wrongs = window.HocVuiQuiz.helpers.wrongList(q);
      if (wrongs.length < 2) return false;
      // Skip when options are very short (emoji-only) — too confusing for young kids
      const opts = window.HocVuiQuiz.helpers.optionList(q);
      if (opts.some(o => o.text.length <= 2)) return false;
      return true;
    },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      const base = (q.question_text || '').trim();
      // Frame it as: here's the question + its correct answer; tap the one that is WRONG.
      const correct = helpers.correctText(q);
      if (questionEl) questionEl.textContent = `❌ Đâu KHÔNG đúng với: ${base}`;
      const ck = helpers.correctKey(q);
      helpers.shuffle(helpers.optionList(q)).forEach(o => {
        const btn = helpers.el('button', 'option-btn elim-btn');
        btn.dataset.key = o.key; btn.textContent = o.text;
        const isWrongOption = o.key !== ck; // tapping a wrong option = success
        btn.addEventListener('click', () => {
          const ok = isWrongOption;
          btn.classList.add(ok ? 'correct' : 'wrong');
          // reveal: mark the actual correct answer (the one to NOT pick) distinctly
          optionsEl.querySelectorAll('.elim-btn').forEach(b => {
            b.classList.add('disabled');
            if (b.dataset.key === ck) b.classList.add('elim-keep');
          });
          finish(ok, o.text);
        });
        optionsEl.appendChild(btn);
      });
      ctx.onReveal(() => {
        optionsEl.querySelectorAll('.elim-btn').forEach(b => { b.classList.add('disabled'); if (b.dataset.key === ck) b.classList.add('elim-keep'); });
      });
    },
  });
})();
