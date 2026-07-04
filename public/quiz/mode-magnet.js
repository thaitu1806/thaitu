// Quiz mode: "🧲 Nam Châm" — answer chips drift inward from 4 edges toward a
// magnet in the center. Tap the correct chip before it passes through.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('magnet', {
    weight: 1.0,
    canUse(q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 3; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ck = helpers.correctKey(q);
      const list = helpers.shuffle(helpers.optionList(q)).slice(0, 4);

      const field = helpers.el('div', 'qz-magnet-field');
      optionsEl.appendChild(field);

      // Central magnet
      const magnet = helpers.el('div', 'qz-magnet-center', '🧲');
      field.appendChild(magnet);

      // Chips drifting in from edges
      let done = false;
      const positions = ['top', 'right', 'bottom', 'left'];
      list.forEach((o, i) => {
        const chip = helpers.el('button', 'option-btn qz-magnet-chip');
        chip.textContent = o.text;
        chip.dataset.key = o.key;
        chip.classList.add('qz-magnet-from-' + positions[i % 4]);
        chip.addEventListener('click', () => {
          if (done) return;
          done = true;
          stop();
          const ok = o.key === ck;
          chip.classList.add(ok ? 'correct' : 'wrong');
          if (ok) {
            chip.classList.add('attracted');
            magnet.classList.add('pulse');
          } else {
            field.querySelectorAll('.qz-magnet-chip').forEach(c => {
              if (c.dataset.key === ck) c.classList.add('correct', 'attracted');
            });
          }
          field.querySelectorAll('.qz-magnet-chip').forEach(c => c.classList.add('disabled'));
          finish(ok, o.text);
        });
        field.appendChild(chip);
      });

      // Animate chips oscillating toward center and back (never leave screen)
      let raf = null, t0 = 0;
      function frame(t) {
        if (!t0) t0 = t;
        // Sine oscillation: chips drift toward center then back, never disappear
        var drift = Math.sin((t - t0) * 0.001) * 40; // ±40px oscillation
        field.style.setProperty('--drift', drift + 'px');
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

      ctx.onReveal(() => {
        done = true; stop();
        field.querySelectorAll('.qz-magnet-chip').forEach(c => {
          c.classList.add('disabled');
          if (c.dataset.key === ck) c.classList.add('correct');
        });
      });
    },
  });
})();
