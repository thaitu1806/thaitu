// Quiz mode: "🎨 Tô Màu" — a shape divided into 4 zones, each labeled with an
// answer. Tap the correct zone to fill it with color + sparkle.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  var SHAPES = ['⭐', '❤️', '🌸', '🦋', '🐱', '🌈'];

  reg('paint', {
    weight: 1.0,
    canUse(q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 3; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ck = helpers.correctKey(q);
      const list = helpers.shuffle(helpers.optionList(q)).slice(0, 4);

      const field = helpers.el('div', 'qz-paint-field');
      optionsEl.appendChild(field);

      // Shape icon in center
      const shape = helpers.el('div', 'qz-paint-shape', SHAPES[Math.floor(Math.random() * SHAPES.length)]);
      field.appendChild(shape);

      // 4 color zones around shape
      const colors = ['#ff6b8b', '#4a90e2', '#34c77b', '#f4b73e'];
      const zones = helpers.el('div', 'qz-paint-zones');
      let done = false;

      list.forEach((o, i) => {
        const zone = helpers.el('button', 'option-btn qz-paint-zone');
        zone.textContent = o.text;
        zone.dataset.key = o.key;
        zone.style.setProperty('--zone-color', colors[i]);
        zone.addEventListener('click', () => {
          if (done) return;
          done = true;
          const ok = o.key === ck;
          zone.classList.add(ok ? 'correct' : 'wrong');
          if (ok) {
            zone.classList.add('painted');
            shape.classList.add('painted');
          } else {
            zones.querySelectorAll('.qz-paint-zone').forEach(z => {
              if (z.dataset.key === ck) z.classList.add('correct', 'painted');
            });
          }
          zones.querySelectorAll('.qz-paint-zone').forEach(z => z.classList.add('disabled'));
          finish(ok, o.text);
        });
        zones.appendChild(zone);
      });
      field.appendChild(zones);

      ctx.onReveal(() => {
        done = true;
        zones.querySelectorAll('.qz-paint-zone').forEach(z => {
          z.classList.add('disabled');
          if (z.dataset.key === ck) z.classList.add('correct', 'painted');
        });
      });
    },
  });
})();
