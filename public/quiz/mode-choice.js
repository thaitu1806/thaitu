// Quiz mode: classic multiple choice (A/B/C/D). Applies to any question.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('choice', {
    weight: 2,
    canUse() { return true; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ck = helpers.correctKey(q);
      helpers.shuffle(helpers.optionList(q)).forEach(o => {
        const btn = helpers.el('button', 'option-btn');
        btn.dataset.key = o.key; btn.textContent = o.text;
        btn.addEventListener('click', () => {
          const ok = o.key === ck;
          reveal(optionsEl, ck, o.key, ok);
          finish(ok, o.text);
        });
        optionsEl.appendChild(btn);
      });
      ctx.onReveal(() => reveal(optionsEl, ck, null, false));
    },
  });

  function reveal(box, ck, sel, ok) {
    box.querySelectorAll('.option-btn').forEach(b => {
      b.classList.add('disabled');
      if (b.dataset.key === ck) b.classList.add('correct');
      else if (sel && b.dataset.key === sel && !ok) b.classList.add('wrong');
    });
  }
})();
