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
    weight: 1.5,
    canUse(q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 3; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ck = helpers.correctKey(q);
      const field = helpers.el('div', 'qz-catch-field');
      optionsEl.appendChild(field);
      const colors = ['#ff7a59', '#4a90e2', '#34c77b', '#f4b73e'];
      const chips = [];
      const isYoung = document.body.classList.contains('qz-young');
      const list = helpers.shuffle(helpers.optionList(q));
      const n = list.length;
      // Each chip gets its OWN horizontal band [i/n .. (i+1)/n] so they spread
      // evenly across the width and never clump into the corner. Stagger them on
      // two vertical rows so they have breathing room.
      const rows = n <= 2 ? 1 : 2;
      list.forEach((o, i) => {
        const chip = helpers.el('button', 'option-btn qz-catch-chip', o.text);
        chip.dataset.key = o.key;
        chip.style.background = colors[i % colors.length];
        const row = i % rows;
        chip.style.top = (((row + 0.5) / rows) * 100) + '%';
        const bandLo = (i / n) * 100 + 7;
        const bandHi = ((i + 1) / n) * 100 - 7;
        const spd = isYoung ? (0.01 + Math.random() * 0.008) : (0.016 + Math.random() * 0.012);
        chips.push({ el: chip, key: o.key, x: (bandLo + bandHi) / 2, lo: bandLo, hi: bandHi, speed: spd, dir: i % 2 ? 1 : -1 });
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
          if (c.x > c.hi) { c.x = c.hi; c.dir = -1; }
          else if (c.x < c.lo) { c.x = c.lo; c.dir = 1; }
          c.el.style.left = c.x + '%';
        });
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

      ctx.onReveal(() => { stop(); field.querySelectorAll('.qz-catch-chip').forEach(c => { c.classList.add('disabled'); if (c.dataset.key === ck) c.classList.add('correct'); }); });
    },
  });
})();
