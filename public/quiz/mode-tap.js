// Quiz mode: "tap the correct one" — the options appear as scattered chips of
// varying size/tilt; the child taps the correct chip. Same data as choice but a
// different feel. Demonstrates that new question types are pure drop-in plugins.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('tap', {
    weight: 1,
    canUse(q) {
      // Needs 3-4 options to feel like a "find it" challenge.
      return window.HocVuiQuiz.helpers.optionList(q).length >= 3;
    },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ck = helpers.correctKey(q);
      optionsEl.classList.add('qz-tap-field');
      const tilts = [-8, 6, -4, 9, -10, 5];
      helpers.shuffle(helpers.optionList(q)).forEach((o, i) => {
        const chip = helpers.el('button', 'option-btn qz-tap-chip', o.text);
        chip.dataset.key = o.key;
        chip.style.setProperty('--tilt', (tilts[i % tilts.length]) + 'deg');
        chip.style.setProperty('--d', (i * 0.06) + 's');
        chip.addEventListener('click', () => {
          const ok = o.key === ck;
          chip.classList.add(ok ? 'correct' : 'wrong');
          if (!ok) {
            // also highlight the right chip
            optionsEl.querySelectorAll('.qz-tap-chip').forEach(c => { if (c.dataset.key === ck) c.classList.add('correct'); });
          }
          optionsEl.querySelectorAll('.qz-tap-chip').forEach(c => c.classList.add('disabled'));
          finish(ok, o.text);
        });
        optionsEl.appendChild(chip);
      });
      ctx.onReveal(() => {
        optionsEl.querySelectorAll('.qz-tap-chip').forEach(c => { c.classList.add('disabled'); if (c.dataset.key === ck) c.classList.add('correct'); });
      });
    },
  });
})();
