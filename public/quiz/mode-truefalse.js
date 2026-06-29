// Quiz mode: True / False. Shows a statement (correct or wrong answer) and asks
// whether it is right. Needs at least one wrong option to ever show a "false".
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('truefalse', {
    weight: 2,
    canUse(q) { return true; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      const correct = helpers.correctText(q);
      const wrongs = helpers.wrongList(q);
      let isTrue = Math.random() < 0.5;
      if (!isTrue && wrongs.length === 0) isTrue = true;
      const shown = isTrue ? correct : wrongs[Math.floor(Math.random() * wrongs.length)].text;
      const base = (q.question_text || '').trim();
      let stmt;
      if (/=\s*\?\s*$/.test(base)) stmt = base.replace(/=\s*\?\s*$/, '= ' + shown);
      else if (/\?\s*$/.test(base)) stmt = base + '  →  ' + shown;
      else stmt = base + '  →  ' + shown;
      if (questionEl) questionEl.textContent = stmt;

      const mk = (label, val, cls) => {
        const b = helpers.el('button', 'option-btn tf-btn ' + cls, label);
        b.addEventListener('click', () => {
          const ok = (val === isTrue);
          b.classList.add(ok ? 'correct' : 'wrong');
          finish(ok, label);
        });
        return b;
      };
      optionsEl.appendChild(mk('❌ Sai', false, 'tf-no'));
      optionsEl.appendChild(mk('✅ Đúng', true, 'tf-yes'));

      ctx.onReveal(() => {
        optionsEl.querySelectorAll('.tf-btn').forEach(b => {
          if (b.classList.contains('tf-yes') === isTrue) b.classList.add('correct');
        });
      });
    },
  });
})();
