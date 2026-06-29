// Quiz mode: "Bắt đáp án" — answer chips glide smoothly back and forth; tap the
// correct one while it moves. A calm timing/aim challenge using the same data.
// Motion is a gentle sine drift (no hard bounce) with a tiny vertical bob so it
// reads well on a small phone screen and chips never jitter or overflow.
// Self-cleans its animation loop on finish/reveal.
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
      // Each chip rides its OWN horizontal row (evenly spaced top→bottom) and
      // sways left↔right on a smooth sine path between 12% and 88% of the field.
      // Amplitude/phase/speed differ per chip so they feel lively but never snap
      // direction or pile up. Younger kids get slower, smaller swings.
      list.forEach((o, i) => {
        const chip = helpers.el('button', 'option-btn qz-catch-chip', o.text);
        chip.dataset.key = o.key;
        chip.style.background = colors[i % colors.length];
        chip.style.top = (((i + 0.5) / n) * 100) + '%';
        // sine params: center ~50%, amplitude keeps it on-screen
        const amp = (isYoung ? 22 : 30) + Math.random() * 6;        // % travel each side
        const freq = (isYoung ? 0.0006 : 0.0011) + Math.random() * 0.0004; // rad/ms
        const phase = (i / Math.max(1, n)) * Math.PI * 2;           // stagger start positions
        const bob = 4 + Math.random() * 3;                          // tiny vertical wobble (%)
        const bobFreq = 0.0016 + Math.random() * 0.0008;
        chips.push({ el: chip, key: o.key, amp, freq, phase, bob, bobFreq });
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

      let raf = null, t0 = 0;
      function frame(t) {
        if (!t0) t0 = t;
        const el = t - t0;
        chips.forEach(c => {
          const x = 50 + c.amp * Math.sin(c.phase + el * c.freq);
          const y = c.bob * Math.sin(el * c.bobFreq + c.phase);
          c.el.style.left = x + '%';
          c.el.style.transform = 'translate(-50%, calc(-50% + ' + y + 'px))';
        });
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

      ctx.onReveal(() => { stop(); field.querySelectorAll('.qz-catch-chip').forEach(c => { c.classList.add('disabled'); if (c.dataset.key === ck) c.classList.add('correct'); }); });
    },
  });
})();
