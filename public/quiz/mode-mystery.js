// Quiz mode: "Hộp bí ẩn" — 3 closed boxes, each hiding one answer (the correct
// one + two random wrong ones). The child opens the box they think is correct.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('mystery', {
    weight: 1.5,
    canUse(q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 3; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const correct = helpers.correctText(q);
      const wrongs = helpers.shuffle(helpers.wrongList(q)).slice(0, 2).map(o => o.text);
      const choices = helpers.shuffle([{ text: correct, ok: true }, ...wrongs.map(t => ({ text: t, ok: false }))]);
      optionsEl.classList.add('qz-mystery-field');
      choices.forEach((c, i) => {
        const box = helpers.el('button', 'option-btn qz-box');
        box.style.setProperty('--d', (i * 0.08) + 's');
        box.innerHTML = `<span class="qz-box-lid">🎁</span><span class="qz-box-val">${c.text}</span>`;
        box.addEventListener('click', () => {
          box.classList.add('open');
          box.classList.add(c.ok ? 'correct' : 'wrong');
          if (!c.ok) {
            optionsEl.querySelectorAll('.qz-box').forEach(b => { if (b.dataset.ok === '1') { b.classList.add('open', 'correct'); } });
          }
          optionsEl.querySelectorAll('.qz-box').forEach(b => b.classList.add('disabled'));
          finish(c.ok, c.text);
        });
        box.dataset.ok = c.ok ? '1' : '0';
        optionsEl.appendChild(box);
      });
      ctx.onReveal(() => {
        optionsEl.querySelectorAll('.qz-box').forEach(b => { b.classList.add('disabled'); if (b.dataset.ok === '1') b.classList.add('open', 'correct'); });
      });
    },
  });
})();
