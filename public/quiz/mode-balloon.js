// Quiz mode: "🎈 Bắn Bóng Bay" — each answer rides a balloon that drifts upward.
// Tap the correct balloon to pop it. Balloons loop (respawn at the bottom) so a
// grade-2 child is never punished by a timer — it's a calm aim/recognition feel,
// visually very different from the static button modes. Cleans up its RAF loop.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('balloon', {
    weight: 1.5,
    canUse(q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 3; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ck = helpers.correctKey(q);
      const field = helpers.el('div', 'qz-balloon-field');
      optionsEl.appendChild(field);
      const colors = ['#ff6b8b', '#4a90e2', '#34c77b', '#f4b73e', '#9d7bff'];
      const list = helpers.shuffle(helpers.optionList(q));
      const n = list.length;
      const balloons = list.map((o, i) => {
        const wrap = helpers.el('button', 'option-btn qz-balloon');
        wrap.dataset.key = o.key;
        wrap.style.setProperty('--bln', colors[i % colors.length]);
        wrap.style.left = ((i + 0.5) * (100 / n)) + '%';
        const label = helpers.el('span', 'qz-balloon-label', o.text);
        wrap.appendChild(label);
        const y = 8 + (i % 3) * 28;             // staggered start heights (%)
        wrap.addEventListener('click', () => {
          const ok = o.key === ck;
          stop();
          wrap.classList.add(ok ? 'correct' : 'wrong', 'pop');
          if (!ok) field.querySelectorAll('.qz-balloon').forEach(b => { if (b.dataset.key === ck) b.classList.add('correct'); });
          field.querySelectorAll('.qz-balloon').forEach(b => b.classList.add('disabled'));
          finish(ok, o.text);
        });
        field.appendChild(wrap);
        return { el: wrap, y, speed: 0.01 + Math.random() * 0.012, sway: Math.random() * Math.PI * 2 };
      });

      let raf = null, last = 0;
      function frame(t) {
        if (!last) last = t;
        const dt = Math.min(50, t - last); last = t;
        balloons.forEach(b => {
          b.y += b.speed * dt;
          if (b.y > 105) b.y = -12;             // loop back to bottom
          b.sway += dt * 0.003;
          b.el.style.bottom = b.y + '%';
          // keep horizontal centering (-50%) while adding gentle sway
          b.el.style.transform = 'translateX(calc(-50% + ' + (Math.sin(b.sway) * 8) + 'px))';
        });
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

      ctx.onReveal(() => { stop(); field.querySelectorAll('.qz-balloon').forEach(b => { b.classList.add('disabled'); if (b.dataset.key === ck) b.classList.add('correct'); }); });
    },
  });
})();
