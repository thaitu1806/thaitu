// Quiz mode: "🪙 Thẻ Cào" — each answer is hidden under a scratch-off panel.
// The child taps/drags to reveal a card, then taps it again to choose. Adds a
// playful "reveal" curiosity without changing the underlying data. Pure DOM, no
// animation loop to clean up.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('scratch', {
    weight: 1.5,
    canUse(q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 2; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ck = helpers.correctKey(q);
      optionsEl.classList.add('qz-scratch-field');
      helpers.shuffle(helpers.optionList(q)).forEach((o, i) => {
        const card = helpers.el('button', 'option-btn qz-scratch', o.text);
        card.dataset.key = o.key;
        const cover = helpers.el('span', 'qz-scratch-cover', '❓');
        card.appendChild(cover);
        card.style.setProperty('--d', (i * 0.05) + 's');
        let revealed = false;
        card.addEventListener('click', () => {
          if (!revealed) { revealed = true; card.classList.add('revealed'); return; }
          const ok = o.key === ck;
          card.classList.add(ok ? 'correct' : 'wrong');
          optionsEl.querySelectorAll('.qz-scratch').forEach(c => { c.classList.add('disabled', 'revealed'); if (!ok && c.dataset.key === ck) c.classList.add('correct'); });
          finish(ok, o.text);
        });
        optionsEl.appendChild(card);
      });
      ctx.onReveal(() => {
        optionsEl.querySelectorAll('.qz-scratch').forEach(c => { c.classList.add('disabled', 'revealed'); if (c.dataset.key === ck) c.classList.add('correct'); });
      });
    },
  });
})();
