// Quiz mode: "🔮 Pha Lê" — 4 crystals orbit slowly in a circle. Tap the
// correct one to make it glow rainbow. Wrong one shatters.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('crystal', {
    weight: 1.0,
    canUse(q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 3; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ck = helpers.correctKey(q);
      const list = helpers.shuffle(helpers.optionList(q)).slice(0, 4);

      const field = helpers.el('div', 'qz-crystal-field');
      optionsEl.appendChild(field);

      // Orbit ring
      const ring = helpers.el('div', 'qz-crystal-ring');
      field.appendChild(ring);

      let done = false;
      const crystals = [];
      list.forEach((o, i) => {
        const gem = helpers.el('button', 'option-btn qz-crystal-gem');
        // Random crystal variant (4 cols × 2 rows = 8 variants)
        const col = i % 4;
        const row = Math.floor(Math.random() * 2);
        gem.innerHTML = '<span class="qz-gem-icon qz-crystal-sprite" style="background-position:' + (col * 33.33) + '% ' + (row * 100) + '%"></span><span class="qz-gem-label">' + o.text + '</span>';
        gem.dataset.key = o.key;
        gem.style.setProperty('--orbit-i', String(i));
        gem.style.setProperty('--orbit-n', String(list.length));
        gem.addEventListener('click', () => {
          if (done) return;
          done = true;
          stop();
          const ok = o.key === ck;
          gem.classList.add(ok ? 'correct' : 'wrong');
          if (ok) {
            gem.classList.add('glow');
          } else {
            gem.classList.add('shatter');
            ring.querySelectorAll('.qz-crystal-gem').forEach(g => {
              if (g.dataset.key === ck) g.classList.add('correct', 'glow');
            });
          }
          ring.querySelectorAll('.qz-crystal-gem').forEach(g => g.classList.add('disabled'));
          finish(ok, o.text);
        });
        ring.appendChild(gem);
        crystals.push(gem);
      });

      // Slow orbit animation via CSS (see quiz-modes.css)
      ring.classList.add('orbiting');

      function stop() { ring.classList.remove('orbiting'); }

      ctx.onReveal(() => {
        done = true; stop();
        ring.querySelectorAll('.qz-crystal-gem').forEach(g => {
          g.classList.add('disabled');
          if (g.dataset.key === ck) g.classList.add('correct', 'glow');
        });
      });
    },
  });
})();
