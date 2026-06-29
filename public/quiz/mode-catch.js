// Quiz mode: "Bắt đáp án" — answer chips drift across the field; tap the correct
// one while it moves. Adds a timing/aim challenge using the same data. Self-cleans
// its animation loop on finish/reveal.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('catch', {
    weight: 1,
    canUse(q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 3; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ck = helpers.correctKey(q);
      const field = helpers.el('div', 'qz-catch-field');
      optionsEl.appendChild(field);
      const colors = ['#ff7a59', '#4a90e2', '#34c77b', '#f4b73e'];
      const chips = [];
      helpers.shuffle(helpers.optionList(q)).forEach((o, i) => {
        const chip = helpers.el('button', 'option-btn qz-catch-chip', o.text);
        chip.dataset.key = o.key;
        chip.style.background = colors[i % colors.length];
        chip.style.top = (12 + i * 22) + '%';
        // each chip drifts at its own speed/phase
        chips.push({ el: chip, key: o.key, x: -20 - Math.random() * 40, speed: 0.18 + Math.random() * 0.18, dir: 1 });
        chip.addEventListener('click', () => {
          const ok = o.key === ck;
          stop();
          chip.classList.add(ok ? 'correct' : 'wrong');
          if (!ok) chips.forEach(c => { if (c.key === ck) c.el.classList.add('correct'); });
          field.querySelectorAll('.qz-catch-chip').forEach(c => c.classList.add('disabled'));
          finish(ok, o.text);
        });
        field.appendChild(chip);
      });

      let raf = null, last = 0;
      function frame(t) {
        if (!last) last = t;
        const dt = Math.min(50, t - last); last = t;
        chips.forEach(c => {
          c.x += c.dir * c.speed * dt;
          if (c.x > 100) { c.x = 100; c.dir = -1; }
          else if (c.x < 0) { c.x = 0; c.dir = 1; }
          c.el.style.left = `calc(${c.x}% - 30px)`;
        });
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

      ctx.onReveal(() => { stop(); field.querySelectorAll('.qz-catch-chip').forEach(c => { c.classList.add('disabled'); if (c.dataset.key === ck) c.classList.add('correct'); }); });
    },
  });
})();
